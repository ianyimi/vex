---
status: draft
spec_id: 2026-11-09-golden-use-cases
touches:
  - ".agent/docs/product/launch-coordination.md"
  - ".agent/docs/product/use-case-backlog.md"
  - ".agent/docs/product/backlog.md"
  - ".agent/docs/product/v0.1.0-launch-plan.md"
  - ".agent/docs/specs/2026-11-09-golden-use-cases/**"
  - ".agent/docs/specs/2026-11-06-launch-kit-final-review/media-session.md"
  - ".agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md"
  - "apps/docs/src/content/docs/guides/deployment.mdx"
  - "apps/docs/src/content/docs/guides/quickstart.mdx"
  - "apps/docs/astro.config.mjs"
  - "packages/create-vexcms/templates/base-nextjs/package.json"
  - "packages/create-vexcms/templates/base-nextjs/README.md"
  - "packages/create-vexcms/README.md"
  - ".changeset/create-vexcms-deploy-script.md"
prompt_version: 1
---

# 2026-11-09-golden-use-cases — Spec

## Overview

Four example projects (magazine, real estate, conference, restaurant) that each go through the
whole VexCMS lifecycle: `pnpm create vexcms@alpha` → config, collections, fields → admin → front end
→ `vex deploy` to Convex prod plus a Vercel production deploy. They back live demos (5- and 15-minute
scripts), recorded clips and the launch-week clips. The developer rotates between them, so no single
example gets reused everywhere. Together they cover every shipped feature (`inventory.md`), and where
a domain needs something unshipped the playbook says so on camera instead of faking it. The spec also
fills the deployment-docs gap the demos expose, rewrites the shared media session's shot list from
scenario 1, and starts a gap-driven backlog of future application types.

## Design Decisions

1. **Four scenarios.** `magazine` (scenario 1), `real-estate`, `conference`, `restaurant`. A docs-site
   example is excluded because dedicated docs tools serve that job better (developer preference, not
   a VexCMS gap). The Agency multi-client (`--orgs`) example is backlogged until invites (#53) ship.
   Both go into `use-case-backlog.md`.
2. **Scenario 1 is the magazine.** It covers all four launch days in one familiar domain: article live
   preview (D2), a field added in config → schema + types (D3), author/editor RBAC plus slug
   `validate()` (D4), and `--bare` scaffold → production (D5). It supplies the four launch clips, the
   demo take and the Product Hunt hero (decision 13).
3. **Launch-day mapping** (day themes from `launch-kit.md` § Day facts): magazine D2–D5; restaurant is
   the D2 alternate (menu and global live preview); conference the D3/D4 alternate (config → blocks +
   global; cross-document validation); real estate the D4 alternate (owner rules, field maps, saved
   views, bulk action).
4. **`inventory.md` is the binding coverage matrix.** Every shipped feature (F1–F61) is ● or ○ in at
   least one scenario, except the listed exceptions: F56 `--orgs`, F59 custom storage adapter, F57
   `--monorepo`/`--yes`. Each exception names where it lands. A scenario step that drops a ● feature
   must move it to another scenario in the same change.
5. **Location: `vexcms/examples`.** Private until Release (T-1), then public. Independent folders
   (`magazine/`, `real-estate/`, `conference/`, `restaurant/`), each a standalone scaffold with its
   own lockfile, exactly what a stranger gets. Licensed Apache-2.0 with a NOTICE, like the core. CI
   runs `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint` per folder (needs no Convex).
   Clone at `~/Documents/Projects/vexcms-examples`, outside the monorepo.
6. **Production stays live.** Each example keeps a Convex prod deployment and a Vercel production
   deployment, linked from its own `<slug>/README.md` and the root README's "Live demos" table. The
   developer creates the prod deployments, Vercel projects and prod env; GU verifies them, links them
   (Step 26) and adds a weekly `live-check` workflow that curls the four URLs. Dev deployments stay
   for live demos. Production sign-up is closed after the demo accounts exist (decision 21).
7. **Published packages only.** Examples pin exact `0.1.0-alpha.35` for every `@vexcms/*` and
   `create-vexcms`; nothing links the workspace. Step 4 lands after DEP and before alpha.35 is cut, so
   the scaffolds already ship `vex:deploy`. Step 27 bumps to `0.1.0` at Release.
8. **A git tag per build stage.** `<slug>/01-scaffold`, `02-collections`, `03-access`, `04-seed`,
   `05-front-end`, `06-deployed`, and `07-v0.1.0` after Release. The 15-minute script scaffolds live,
   then resumes from tags; `seed:reset` restores the data for that stage.
9. **Seed, reinit, reset, demo accounts.** `convex/seed.ts` mirrors `apps/www/convex/seed.ts`:
   `init` inserts missing documents, `reinit` patches seeded documents back (`runSeed(ctx, "insert" |
   "patch")`, documents matched on slug/name). **Deviation:** a new `reset` mutation also deletes
   documents a take created (not in the seed) from the example's own content collections. www has no
   reset because its content is curated by hand; demos need an exact start state between takes.
   Better Auth hashes passwords, so demo accounts are created by `scripts/create-demo-accounts.mjs`:
   HTTP sign-up on the running app, then an internal mutation sets roles. Credentials come from
   gitignored `.env.local` `DEMO_*` variables and are never committed.
10. **Mixed tier.** `[dev]`: collection/global configs, `access.ts` rules, hooks, `validate()`,
    `Input` overrides and slot contributions, written as guided stubs (code-rules.md), because the
    developer explains this code on camera. `[agent]`: scaffolding, seeds, scripts, front-end routes,
    CI, docs, playbooks, board and bookkeeping, in full.
11. **Playbooks are beats, not talk tracks.** `playbooks/<slug>.md` (private, in this spec directory)
    holds per scenario: the stage tags, seed data summary, launch day, a 5-minute and a 15-minute
    live script, and a recorded shot list. Each beat has a time budget, an on-screen action or command,
    the feature id plus doc link it proves, and the gap callout where one applies. No spoken
    sentences: the developer speaks in their own words (LK Design Decision 2 extends to anything that
    ends up in recorded media). The 5-minute script starts from `05-front-end` with seeded data and
    makes one live change. The 15-minute script scaffolds live, jumps across tags, and ends on the
    deploy beat, shown from the Vercel build log and the live production URL (decision 6), never a
    deploy run live on stage.
12. **Recorded demos are silent clips only.** 2–4 per scenario, using `media-session.md`'s encode
    rules (H.264, no audio track, ≤ 60 s, ≤ 10 MB). Long-form narrated videos are out of scope.
13. **`media-session.md` rewrite scope.** The four D2–D5 clips, the 30–60 s demo take/GIF and the PH
    gallery hero come from the magazine on :3200 (the developer's own servers during LK-8). The `/tour`
    PNGs and the brand admin/mobile screenshots stay on `apps/www`, because `/tour`'s captions describe
    the www admin. The clip slugs and filenames stay the same, so `launch-kit.md`'s posts and URLs need
    no change. Its D5 fact sheet only gains the deployment-guide link (carve-out in Out of Scope).
14. **Scoped P-024 exception, modelled on LI-19/D7.** Requested in § Human queue and recorded in
    § Log when granted. GU may run `create-vexcms`, `vex dev`, `next dev` and the Convex CLI only inside `~/Documents/Projects/vexcms-examples/<slug>`, on ports magazine 3200,
    real-estate 3210, conference 3220, restaurant 3230, against the Convex projects
    `vex-example-<slug>`. Against production GU only runs `demo:accounts`, `convex env set
    AUTH_DISABLE_SIGN_UP` and read-only checks, with a deploy key the developer provides. Never
    in the monorepo; :3030/:3020 and their deployments are never touched; every service the step
    started is stopped at the end of the step. Until the exception is granted, every step marked
    "needs developer exception" stays `human` on the board.
15. **The deployment fix covers CLI, docs and templates.** `vex deploy` today parses no flags: it
    ignores even `--cwd` and runs a bare `convex deploy` under a 120 s timeout. There was no stated
    reason; the deploy command was simply never given options. Step 3 makes it
    `vex deploy [--cwd <dir>] [convex deploy flags…]`: unknown flags are forwarded to the final
    `convex deploy`, auto-migration pre-pushes get the target flags but not `--cmd`, and deploy has no
    timeout. The Vercel build command is then Convex's own recipe through vex,
    `pnpm vex:deploy --cmd 'pnpm build'`. Step 3 also adds the new `guides/deployment` page and fixes
    the access-control guide's relationship owner examples (they compare a bare id against a
    list-stored field). Step 4 adds a `vex:deploy` script and README § Deployment in `base-nextjs`
    (the marketing overlay inherits both) and updates the `create-vexcms` README. All of this lands
    before alpha.35. The magazine deploy (Step 11) follows the guide word for word and fixes any
    deviation.
16. **Gaps are recorded, not filled.** Every gap a build or run-through exposes goes into
    `inventory.md` § Gaps, then `backlog.md`/`use-case-backlog.md` at Step 28, and the demo's gap
    callout. No library feature is added to make a demo work, apart from decision 15.
17. **`use-case-backlog.md` is private** (`.agent/docs/product/`). One row per app type × the gaps
    blocking it, with "unblocked when" and a feature-rank table (how many app types each gap
    unblocks) for ordering post-launch features.
18. **Board.** A new GU section, one row per step. A § Locks row covers `media-session.md` and
    `launch-kit.md` for GU-13. A § Log line tells LK that LK-8 should run only after GU-13 is done,
    because GU can't edit LK rows (rule 2). Another § Log line tells LK's L pass (step 19, GitHub +
    external) that the examples repo README becomes a public surface at T-1.
19. **Mirrors.** The run-through table mirrors `launch-infrastructure/n-runthrough.md`; seeds mirror
    `apps/www/convex/seed.ts`; starting code is the published `base-nextjs`/`marketing-site`
    templates; front-end live preview mirrors the marketing template's `pages` route + Draft Mode
    route; access rules mirror `apps/www/src/auth/access.ts`; the shot list keeps `media-session.md`'s
    table shape. Deviations: decision 9's `reset`; decision 5's separate repo (examples must resolve
    published packages).
20. **Release.** At T-1, after `changeset pre exit` + publish: the developer flips the repo public;
    GU bumps every example to `0.1.0`, regenerates, verifies, and tags `<slug>/07-v0.1.0` (Step 27).
    Both are added to the launch plan's § Release mechanics (Step 28).
21. **Production sign-up closes after setup.** Each example's Better Auth options set
    `emailAndPassword.disableSignUp` when the Convex env var `AUTH_DISABLE_SIGN_UP` is `"true"`. On
    prod: the developer signs up first (becoming admin), `pnpm demo:accounts` runs against the prod
    URL, then the flag is set. The templates have no auth rate limits, so open sign-up on four public
    deployments is an abuse and cost surface. Conference's `anonRole` read-only admin is unaffected.
22. **Magazine authors are users.** `articles.author` is a single relationship to the user
    collection; byline fields (slug, bio, avatar) extend the user collection. The owner rule then
    indexes `articles.author` directly (`indexedOwnerCheck`), with no copied `authorUserId` field and
    no hook keeping it in sync. Cost: every byline needs an account, and public author pages must
    never expose `email`. Rejected: an `authors` profile collection, which needs a hidden copied user
    id that goes stale when a profile's user link changes.
23. **Relationships stay list-stored.** Storing a single relationship as a plain id was assessed and
    backlogged. Indexing already works: `normalizeArrayStoredWhere` wraps single-relationship filter
    values and `indexedOwnerCheck` compares `[user._id]`. The change would cost a data migration plus
    every relationship reader, and hasMany membership stays unindexable either way.

## Out of Scope

- A docs-site example, and the Agency multi-client (`--orgs`) example (backlogged in `use-case-backlog.md`).
- Long-form narrated videos; verbatim talk tracks.
- Promoting any example to a `create-vexcms` template (revisit after launch).
- A `--monorepo`/workspace layout for the examples repo.
- A demo custom storage adapter.
- New library features to fill a gap, other than decision 15 (`vex deploy` flag passthrough, deployment guide, `vex:deploy` script, access-control docs fix).
- Changing how relationships are stored (decision 23).
- Agent-created production infrastructure: the developer creates the Convex prod deployments, Vercel projects and prod env.
- Editing `launch-kit.md` or LK board rows, except the D5 fact-sheet deployment-guide link under GU-13's lock.
- Changing `/tour`, `apps/www` or `apps/test` content or screenshots.
- `next build` in the examples CI (needs a live Convex URL per example).

## Implementation

### Step 1 — Board section, locks, human queue [agent]

Why: board rule 2 — GU edits only its own rows; the `media-session.md` rewrite (GU-13) edits an
LK-owned file and needs a lock row.

Existing-file edits to `.agent/docs/product/launch-coordination.md`, anchored on the identifiers
below (current content as read from the file; re-read before applying if another session's
concurrent edit has moved these blocks).

- [ ] Session table: add the GU row
- [ ] New `### GU — golden use cases` status table (GU-1…GU-28)
- [ ] § Locks: add the row covering `media-session.md` + `launch-kit.md`
- [ ] § Human queue: append the GU items
- [ ] § Log: append the two Decision 18 heads-up lines

#### .agent/docs/product/launch-coordination.md

Edit 1 — session table. Anchor: the existing row ending `| DEP-*         |` (the last row of the
table under the `## Rules` heading's preceding session table). Insert immediately after it:

````markdown
| GU      | `.agent/docs/specs/2026-11-09-golden-use-cases/`        | GU-*                  |
````

Edit 2 — new GU status section. Anchor: insert immediately after the `### DEP — pre-launch
dependency upgrades` table's last row (`| DEP-7 | ... | todo | |`) and before the `## Human
queue` heading:

````markdown

### GU — golden use cases

| Row   | Step                                                                   | Waits for                                                                                     | Status | Notes |
| ----- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------ | ----- |
| GU-1  | Board section, locks, human queue                                       | —                                                                                                 | todo   |       |
| GU-2  | Use-case backlog                                                         | —                                                                                                 | todo   |       |
| GU-3  | `vex deploy` flag passthrough + deployment guide                        | —                                                                                                 | todo   | alpha.35 published after this step |
| GU-4  | Templates: `vex:deploy` script + README Deployment                      | GU-3; DEP (`2026-11-07-pre-launch-dependency-upgrades`) done — both edit `templates/base-nextjs/package.json` | todo   | alpha.35 published after this step |
| GU-5  | Examples repo skeleton                                                   | human: private `vexcms/examples` created + cloned to `~/Documents/Projects/vexcms-examples`      | human  |       |
| GU-6  | Magazine 01: scaffold on alpha.35                                        | GU-5, alpha.35 published, exception granted                                                      | human  | needs developer exception |
| GU-7  | Magazine 02: collections and fields                                     | alpha.35 published                                                                                | human  | needs developer exception |
| GU-8  | Magazine 03: access, hooks, validation, slots                           | alpha.35 published                                                                                | human  | needs developer exception |
| GU-9  | Magazine 04: seed, reset, demo accounts                                 | alpha.35 published                                                                                | human  | needs developer exception |
| GU-10 | Magazine 05: front end, live preview, richtext render                   | alpha.35 published                                                                                | human  | needs developer exception |
| GU-11 | Magazine 06: Convex prod + Vercel production                            | human — magazine Convex prod + Vercel project + env set up; alpha.35 published                   | human  | needs developer exception |
| GU-12 | Magazine playbook + run-through                                         | alpha.35 published                                                                                | human  | needs developer exception |
| GU-13 | `media-session.md` rewrite + D5 fact-sheet link                         | GU-12, alpha.35 published                                                                         | todo   | § Locks: `media-session.md` + `launch-kit.md` |
| GU-14 | Real estate 01–02: scaffold, collections, fields                        | GU-12, alpha.35 published                                                                         | human  | needs developer exception |
| GU-15 | Real estate 03: access, hooks, list views, bulk action                  | alpha.35 published                                                                                | human  | needs developer exception |
| GU-16 | Real estate 04–05: seed and front end                                   | alpha.35 published                                                                                | human  | needs developer exception |
| GU-17 | Real estate 06: deploy, playbook, run-through                           | human — real-estate Convex prod + Vercel project + env set up; alpha.35 published                 | human  | needs developer exception |
| GU-18 | Conference 01–02: scaffold, collections, global, blocks, OAuth          | GU-12; human: GitHub OAuth app (dev callback); alpha.35 published                                 | human  | needs developer exception |
| GU-19 | Conference 03: access, hooks, validation                                | alpha.35 published                                                                                | human  | needs developer exception |
| GU-20 | Conference 04–05: seed, front end, test kit                             | alpha.35 published                                                                                | human  | needs developer exception |
| GU-21 | Conference 06: deploy, playbook, run-through                            | human — conference Convex prod + Vercel project + env set up, GitHub OAuth prod callback; alpha.35 published | human  | needs developer exception |
| GU-22 | Restaurant 01–02: scaffold, collections, hours global, brand themes     | GU-12, alpha.35 published                                                                         | human  | needs developer exception |
| GU-23 | Restaurant 03: access, Input override, duplicate                        | alpha.35 published                                                                                | human  | needs developer exception |
| GU-24 | Restaurant 04–05: seed and front end                                    | alpha.35 published                                                                                | human  | needs developer exception |
| GU-25 | Restaurant 06: deploy, playbook, run-through                            | human — restaurant Convex prod + Vercel project + env set up; alpha.35 published                  | human  | needs developer exception |
| GU-26 | Live deployments: README links + health check                           | GU-11, GU-17, GU-21, GU-25                                                                         | todo   |       |
| GU-27 | Release: repo public, 0.1.0 bump, retag                                 | Release mechanics (`changeset pre exit` + publish); human: flip `vexcms/examples` public          | human  | needs developer exception |
| GU-28 | Bookkeeping                                                              | —                                                                                                  | todo   |       |

````

Edit 3 — § Locks. Anchor: the existing last row,
`| \`.agent/docs/product/v0.1.0-launch-plan.md\` + \`backlog.md\` | free |`. Insert immediately
after it:

````markdown
| `.agent/docs/specs/2026-11-06-launch-kit-final-review/media-session.md` + `launch-kit.md` | free |
````

Edit 4 — § Human queue. Anchor: the existing last item, the `LK-VW` line (the one ending
"each ruling becomes a new VW entry → applied to every surface in the same turn"). Append
immediately after it:

````markdown
- [ ] GU-5: create the private GitHub repo `vexcms/examples` (Apache-2.0, empty) and clone it to `~/Documents/Projects/vexcms-examples`, outside this monorepo → unblocks GU-5, then every GU-6+ step
- [ ] GU-6: grant the scoped P-024 exception, modelled on LI-19/D7 (Design Decision 14): GU may run `create-vexcms`, `vex dev`, `next dev`, `vex deploy`, `vercel` and the Convex CLI only inside `~/Documents/Projects/vexcms-examples/<slug>`, on ports magazine 3200, real-estate 3210, conference 3220, restaurant 3230, against the Convex projects `vex-example-<slug>`. Production uses deploy keys and a Vercel token the developer provides. Never in the monorepo; :3030/:3020 and their deployments are never touched; every service the step started is stopped at the end of the step → record the grant in § Log when given; unblocks GU-6…GU-27 (every step marked "needs developer exception")
- [ ] GU-3/GU-4: once GU-3 lands (`vex deploy` flag passthrough) and GU-4 lands (`vex:deploy` ships in both scaffolds), publish `@vexcms/*@0.1.0-alpha.35` and `create-vexcms@0.1.0-alpha.35` → unblocks GU-6…GU-25 (every step waiting on alpha.35 published)
- [ ] GU-11/17/21/25: per example, create the Convex prod deployment, the Vercel project (`vexcms-example-<slug>`), and set every production env var the deployment guide lists — then sign up on the production URL yourself first (the first account on a deployment is auto-promoted to admin) → unblocks GU-11 (magazine), GU-17 (real estate), GU-21 (conference), GU-25 (restaurant)
- [ ] GU-18/21: create a GitHub OAuth app for the conference example — a dev callback (`http://localhost:3220/api/auth/callback/github`) for GU-18 and a prod callback (the chosen `vexcms-example-conference` domain) for GU-21 — and give GU the client id/secret for each → unblocks GU-18, GU-21
- [ ] GU-27: at T-1, flip `vexcms/examples` from private to public → unblocks GU-27 (0.1.0 bump + retag)
````

Edit 5 — § Log. Anchor: the existing last line (the `2026-11-10T03:00Z LK: scope change …`
line, end of file). Append immediately after it:

````markdown
- <ISO time> GU: heads-up for LK — LK-8 (shared media session) should run only after GU-13 (`media-session.md` rewrite) is done; GU can't edit LK's own rows (rule 2).
- <ISO time> GU: heads-up for LK — the `vexcms/examples` README becomes a public surface at T-1 (Design Decision 20, GU-27); LK's L pass (step 19, GitHub + external) should check it then.
````

Verify: `launch-coordination.md` has § GU with rows GU-1…GU-28, a § Locks row for the two LK
files, the human-queue items and one § Log line (two, per Decision 18); no other session's row
changed (`git diff` shows additions only outside § GU).

### Step 2 — Use-case backlog [agent]

Why: the developer keeps backlogged app types on file and ranks features by how many common
project types each one unblocks.

New file + one existing-file pointer edit.

- [ ] `.agent/docs/product/use-case-backlog.md` (new)
- [ ] `.agent/docs/product/backlog.md` — one pointer entry (board lock)

#### .agent/docs/product/use-case-backlog.md

````markdown
# Use-case backlog

Private (Design Decision 17, `2026-11-09-golden-use-cases`). One row per application type ×
the shipped-feature gaps blocking it, with "unblocked when" and a feature-rank table counting
how many app types each gap unblocks — for ordering post-launch feature work. Built from
`inventory.md`'s coverage matrix and "Not shipped" table in the same spec directory.

## The four golden scenarios

Every scenario is covered end to end today (`inventory.md`'s coverage matrix) and is not a
backlog entry — listed here only as the baseline the rest of this file compares against.

| Scenario | Template | Ports (dev) | Launch day(s) covered | Design decisions proved |
|---|---|---|---|---|
| Magazine | `--bare` | 3200 | D2–D5 | live preview (D2), config → schema/types (D3), author/editor RBAC + slug `validate()` (D4), `--bare` scaffold → production (D5) |
| Real estate | `--bare` | 3210 | D4 alternate | owner rules, field maps, saved views, bulk action |
| Conference | marketing-site | 3220 | D3/D4 alternate | config → blocks + global, cross-document `validate()` |
| Restaurant | marketing-site | 3230 | D2 alternate | menu + global live preview |

## Backlogged application types

"Buildable today?" means buildable using only shipped VexCMS primitives (fields, admin,
access control, Local API) without a developer hand-rolling a missing CMS primitive as custom
Convex/Next code. Every "Blocking gap(s)" cell below cites a `planned`-labelled GitHub issue
on `ianyimi/vex` or a `backlog.md` heading that exists today.

| App type | Needs | Blocking gap(s) | Buildable today? | Unblocked when |
|---|---|---|---|---|
| Agency multi-client (`--orgs`) | Multi-tenant orgs, per-org teammate invites | API keys + team management (invites) — [#53](https://github.com/ianyimi/vex/issues/53) | No — `--orgs` ships (F56) but nothing invites a second person into an org end to end | #53 ships |
| Docs site | Structured doc tree, versioned pages, full-text search | — | Yes, but out of scope by developer preference (Design Decision 1) — dedicated docs tools serve this job better, not a VexCMS gap | N/A |
| Multilingual corporate site | Per-locale content + routing | Localization — [#59](https://github.com/ianyimi/vex/issues/59) | No | #59 ships |
| Newsroom with embargoes | Timed/embargoed publish | Scheduled publishing — [#63](https://github.com/ianyimi/vex/issues/63) | No — drafts/publish exist (F31), no timed release | #63 ships |
| Job board | Visitor-submitted applications | Form builder (visitor submissions) — [#57](https://github.com/ianyimi/vex/issues/57) | Partial — postings buildable today; applications need a hand-rolled Convex mutation outside the content model | #57 ships |
| Membership / community submissions | Visitor-submitted profiles or posts | Form builder (visitor submissions) — [#57](https://github.com/ianyimi/vex/issues/57) | Partial — same workaround as job board | #57 ships |
| Nonprofit donation / volunteer forms | Visitor-submitted volunteer signup; donation intake | Form builder (visitor submissions) — [#57](https://github.com/ianyimi/vex/issues/57) | Partial — donation itself can link out to an external processor (no VexCMS gap there); volunteer signup needs the same workaround as job board | #57 ships |
| Headless mobile-app content | API-key-authenticated REST reads for a native client | `backlog.md` § HTTP API for vex server functions (API-key auth) | No — the Local API (F49) is a server-side TypeScript import, not a REST surface a mobile client can call | that backlog entry ships |
| Franchise multi-site | One org per location, shared brand, local content | API keys + team management (invites) — [#53](https://github.com/ianyimi/vex/issues/53) | No — same org-invite gap as Agency multi-client | #53 ships |
| Event ticketing | Ticket/RSVP forms, embargoed event pages | Form builder (visitor submissions) — [#57](https://github.com/ianyimi/vex/issues/57); Scheduled publishing — [#63](https://github.com/ianyimi/vex/issues/63) | No | #57 and #63 ship |
| Podcast network | Episode audio uploads, show/season relationships, RSS feed | — | Yes — `upload`/media (F14, F36), `relationship` (F13), `array`/`group` (F15, F16) cover the content model; an RSS route is app-level routing, not a CMS gap | N/A |
| Product catalog | Variants/SKUs, external inventory sync | Outbound webhooks — [#60](https://github.com/ianyimi/vex/issues/60) | Partial — the catalog itself (F15/F16 array/group) is buildable today; syncing an external inventory system needs webhooks | #60 ships |
| Course / LMS | Drip-released lessons, role-gated content | Scheduled publishing — [#63](https://github.com/ianyimi/vex/issues/63) | Partial — role-gating is buildable today (F39–F41 RBAC); drip scheduling is not | #63 ships |

### Shipped but not demoed (not backlogged)

Per `inventory.md`'s Listed exceptions, these ship but aren't shown on camera for reasons
unrelated to a feature gap — not new backlog rows:

- **F57 `--monorepo`/`--yes`** — the examples repo is independent folders (Design Decision 5);
  scenario answers are typed live, not defaulted. Revisit only if a monorepo example is added.
- **F59 custom storage adapter** — a guide-only extension point; no S3/decision 15 adapter exists to
  demo honestly. If a future app type specifically needs CDN-scale media (large product catalogs,
  a podcast network's audio library) past Convex file storage, re-evaluate against whichever
  storage adapter ships first.

## Feature rank

How many backlogged app types each gap unblocks, recounted from the table above:

| Gap | App types unblocked | Count |
|---|---|---|
| Form builder (visitor submissions) — #57 | Job board, Membership/community submissions, Nonprofit donation/volunteer forms, Event ticketing | 4 |
| Scheduled publishing — #63 | Newsroom with embargoes, Event ticketing, Course/LMS | 3 |
| API keys + team management (invites) — #53 | Agency multi-client, Franchise multi-site | 2 |
| Localization — #59 | Multilingual corporate site | 1 |
| HTTP API for vex server functions (API-key auth) | Headless mobile-app content | 1 |
| Outbound webhooks — #60 | Product catalog | 1 |

## How to use this file

When picking the next post-launch feature, prefer the top of the Feature rank table — it
unblocks the most backlogged app types per unit of work, not just the single app type that
prompted the request. Add a new app type as a new row whenever a backlogged project idea
surfaces (a support thread, a GitHub discussion, a developer's own next build); recompute the
rank table's counts in the same edit. A gap that reaches 0 (every citing issue closed) is
removed from the rank table, and every row that cited it moves to "buildable today? yes".
````

#### .agent/docs/product/backlog.md

Anchor: the existing `## Entry format` section's closing `---` separator (the one immediately
before the first real entry, `## Tag-based cache control (...)`. Insert the new entry
immediately after that `---`, before the `## Tag-based cache control` heading — or, since
entries otherwise read newest/most-relevant first in no fixed order, insert at the end of the
file after its current last entry instead if that anchor has shifted; either placement satisfies
the board-lock rule as long as it's a single new top-level `##` entry.

````markdown
## Backlogged application types (golden use cases)

**What.** A ranked list of common project types VexCMS can't yet build end to end — Agency
multi-client, multilingual corporate, newsroom with embargoes, job board, membership/community
submissions, nonprofit donation/volunteer forms, headless mobile-app content, franchise
multi-site, event ticketing, podcast network, product catalog, course/LMS — plus the docs-site
type excluded by developer preference, not a gap. Each row names what it needs, the shipped-
feature gap blocking it, and a feature-rank table counting how many app types each gap unblocks.

**Why.** The golden-use-cases spec's four demo scenarios (`2026-11-09-golden-use-cases`) cover
every shipped feature except `--orgs` and a custom storage adapter (`inventory.md` Listed
exceptions); everything that needs an unshipped feature goes here instead of being faked on
camera (that spec's Design Decision 16).

**Lift.** N/A — a tracking document, not a feature.

**Blockers.** None for the document itself; each row names its own blocking gap (already-
tracked GitHub issues #53/#57/#59/#60/#63, or the "HTTP API for vex server functions" entry
above).

**Why deferred.** Not deferred — recorded here because `use-case-backlog.md` is private
(that spec's Design Decision 17) and this entry is the public pointer to it.

**Detail.** `.agent/docs/product/use-case-backlog.md`

---
````

Verify: every gap cell in `use-case-backlog.md` cites a `planned` issue number or a
`backlog.md` heading that exists; the rank table's counts equal a recount of the matrix;
`backlog.md` links the file.

### Step 3 — `vex deploy` flag passthrough + deployment guide [agent]

Why: `vex deploy` forwards no flags to `convex deploy`, so a project with a custom build step
(or the Vercel `--cmd` recipe this guide now documents) can't use it — fixed here, before
alpha.35 is cut, same as GU-4. No docs page covers Convex prod + Vercel production either; D5
and every scenario's deploy beat link here. The `access-control.mdx` `authorId` examples also
have a real bug (decision 15), fixed in the same pass since both are docs housekeeping.

- [ ] `packages/cli/src/lib/parseArgs.ts` (new)
- [ ] `packages/cli/src/lib/parseArgs.test.ts` (new)
- [ ] `packages/cli/src/index.ts` — use `parseArgs`, forward `convexArgs` to `deploy`
- [ ] `packages/cli/src/commands/deploy.ts` — `deployCommand({ cwd, convexArgs })`, honor `--cwd`, strip `--cmd`/`--cmd-url-env-var-name` on interim pushes only
- [ ] `packages/cli/src/lib/convexProcess.ts` — `deployToProduction({ cwd, convexArgs })`, no timeout, `execFileSync` with an argv array, `stripCmdFlags`
- [ ] `packages/cli/src/lib/convexProcess.test.ts` (new)
- [ ] `packages/cli/src/commands/deploy.test.ts` (new)
- [ ] `.changeset/cli-deploy-flag-passthrough.md` (new, `patch`, P-025)
- [ ] `apps/docs/src/content/docs/guides/deployment.mdx` (new)
- [ ] `apps/docs/src/content/docs/guides/access-control.mdx` — fix the two broken `authorId` examples (decision 15)
- [ ] `apps/docs/astro.config.mjs` — sidebar entry (board lock)
- [ ] `apps/docs/src/content/docs/guides/quickstart.mdx` — "Next steps" link

#### packages/cli/src/lib/parseArgs.ts

````ts
/**
 * Parsed shape of `vex <command> [...]`'s argv, after vex's own flags
 * (`--once`, `--json`, `--cwd`) are consumed. Everything `deploy` doesn't
 * own — `--cmd`, `--preview-create`, and the rest — passes through as
 * `convexArgs`, forwarded verbatim to the underlying `convex deploy` call.
 */
export interface ParsedCliArgs {
  command: string | undefined;
  once: boolean;
  json: boolean;
  cwd: string | undefined;
  telemetryAction: string | undefined;
  convexArgs: string[];
}

/**
 * Parse `process.argv.slice(2)` into vex's own flags plus, for `deploy`,
 * every leftover argument forwarded to `convex deploy`.
 *
 * `--cwd <dir>` is consumed by vex itself (`deployCommand`'s `cwd`) and
 * never forwarded — `convex deploy` has no `--cwd` flag of its own.
 * `--once`/`--json` are vex-only flags (`dev`/`telemetry`); `deploy` never
 * emits them, so they are never mistaken for `convexArgs`.
 *
 * @param args - `process.argv.slice(2)`.
 * @returns The parsed flags plus `command` and, for `deploy`, `convexArgs`.
 */
export function parseCliArgs(args: string[]): ParsedCliArgs {
  const command = args[0];
  let once = false;
  let json = false;
  let cwd: string | undefined;
  let telemetryAction: string | undefined;
  const convexArgs: string[] = [];

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--once") {
      once = true;
    } else if (arg === "--json") {
      json = true;
    } else if (arg === "--cwd" && args[i + 1]) {
      cwd = args[++i];
    } else if (command === "telemetry" && telemetryAction === undefined && !arg?.startsWith("--")) {
      telemetryAction = arg;
    } else if (command === "deploy") {
      convexArgs.push(arg);
    }
  }

  return { command, once, json, cwd, telemetryAction, convexArgs };
}
````

#### packages/cli/src/lib/parseArgs.test.ts

````ts
import { describe, expect, it } from "vitest";

import { parseCliArgs } from "./parseArgs";

describe("parseCliArgs", () => {
  it("forwards --cmd and its value to convexArgs for deploy", () => {
    const parsed = parseCliArgs(["deploy", "--cmd", "pnpm build"]);
    expect(parsed.command).toBe("deploy");
    expect(parsed.convexArgs).toEqual(["--cmd", "pnpm build"]);
  });

  it("forwards --preview-create and its value to convexArgs for deploy", () => {
    const parsed = parseCliArgs(["deploy", "--preview-create", "x"]);
    expect(parsed.convexArgs).toEqual(["--preview-create", "x"]);
  });

  it("forwards multiple convex deploy flags in order", () => {
    const parsed = parseCliArgs(["deploy", "--cmd", "pnpm build", "--cmd-url-env-var-name", "VITE_CONVEX_URL"]);
    expect(parsed.convexArgs).toEqual(["--cmd", "pnpm build", "--cmd-url-env-var-name", "VITE_CONVEX_URL"]);
  });

  it("consumes --cwd itself and never forwards it to convexArgs", () => {
    const parsed = parseCliArgs(["deploy", "--cwd", "/tmp/project", "--cmd", "pnpm build"]);
    expect(parsed.cwd).toBe("/tmp/project");
    expect(parsed.convexArgs).toEqual(["--cmd", "pnpm build"]);
  });

  it("collects no convexArgs for a bare deploy", () => {
    expect(parseCliArgs(["deploy"]).convexArgs).toEqual([]);
  });

  it("never populates convexArgs for a non-deploy command", () => {
    const parsed = parseCliArgs(["dev", "--once", "--cwd", "/tmp/project"]);
    expect(parsed.once).toBe(true);
    expect(parsed.cwd).toBe("/tmp/project");
    expect(parsed.convexArgs).toEqual([]);
  });
});
````

#### packages/cli/src/index.ts

Whole-file replace (the file is only the argv-parsing/dispatch script; everything below is the
new content):

````ts
import { deployCommand } from "./commands/deploy.js";
import { devCommand } from "./commands/dev.js";
import { generateCommand } from "./commands/generate.js";
import { telemetryCommand } from "./commands/telemetry.js";
import { logger } from "./lib/logger.js";
import { parseCliArgs } from "./lib/parseArgs.js";

const { command, once, json, cwd, telemetryAction, convexArgs } = parseCliArgs(process.argv.slice(2));

switch (command) {
  case "dev":
    devCommand({ once, cwd }).catch((err) => {
      logger.error("Fatal error", err);
      process.exit(1);
    });
    break;

  case "deploy":
    deployCommand({ cwd, convexArgs }).catch((err) => {
      logger.error("Fatal error", err);
      process.exit(1);
    });
    break;

  case "generate":
    generateCommand({ cwd }).catch((err) => {
      logger.error("Fatal error", err);
      process.exit(1);
    });
    break;

  case "telemetry":
    telemetryCommand({ action: telemetryAction, json, cwd }).catch((err) => {
      logger.error("Fatal error", err);
      process.exit(1);
    });
    break;

  default:
    console.log(`
Usage: vex <command>

Commands:
  dev [options]       Generate vex schema, start convex dev, and watch for
                      collection config changes. Run your app server (e.g.
                      next dev) in a separate terminal.
  deploy [options]    Generate schema, auto-migrate if enabled, and deploy
                      to production. Replaces \`convex deploy\` in CI. Any
                      flag vex doesn't own (--cmd, --preview-create, ...)
                      forwards straight through to the final \`convex
                      deploy\` call.
  generate [options]  Regenerate vex.types.ts from the vex config.
  telemetry <action>  Manage anonymous CLI telemetry: enable, disable, or
                      status [--json].

Options:
  --once              (dev) Generate schema, push to Convex, and exit
  --cwd <dir>         Run as if started from <dir>
  --json              (telemetry status) Print the exact payload
`);
    process.exit(command ? 1 : 0);
}
````

#### packages/cli/src/commands/deploy.ts

Edit 1 — imports. Anchor: the existing import block (lines 1–10, ending
`import type { VexConfig } from "@vexcms/core";`). Add `stripCmdFlags` to the `convexProcess.js`
import:

````ts
import { classifyTelemetryError, recordTelemetryEvent } from "@vexcms/telemetry";
import { anonymizeConfig } from "@vexcms/telemetry/config";

import { generateAndWrite, type GenerateResult } from "../lib/generateSchema.js";
import { deployToProduction, stripCmdFlags } from "../lib/convexProcess.js";
import { loadConfig } from "../lib/loadConfig.js";
import { logger } from "../lib/logger.js";
import { isServerConfigPath, resolveConfigPath } from "../lib/resolveConfigPath.js";

import type { VexConfig } from "@vexcms/core";
````

Edit 2 — function signature + `cwd`. Anchor: the existing
`export async function deployCommand(): Promise<void> {\n  const cwd = process.cwd();`. Replace
with:

````ts
export interface DeployCommandOptions {
  /** Run as if started from this directory (default `process.cwd()`). */
  cwd?: string;
  /** Flags vex doesn't own, forwarded to the final `convex deploy` call. */
  convexArgs?: string[];
}

/**
 * `vex deploy` — generate schema, auto-migrate if enabled, then run
 * `convex deploy` to push to production. Replaces `convex deploy` in CI.
 * `options.convexArgs` forwards straight through to the final deploy; the
 * auto-migration interim pushes strip `--cmd`/`--cmd-url-env-var-name` from
 * it so a custom build command runs once, not on every interim push.
 */
export async function deployCommand(options: DeployCommandOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const convexArgs = options.convexArgs ?? [];
````

Edit 3 — interim push. Anchor: the existing
`// Use \`convex deploy\` for all schema pushes (interim + final)\n  const pushSchema = (pushCwd: string) => deployToProduction(pushCwd);`.
Replace with:

````ts
  // Use `convex deploy` for all schema pushes (interim + final). Interim
  // pushes strip --cmd/--cmd-url-env-var-name so the build command runs
  // once, on the final deploy below.
  const pushSchema = (pushCwd: string) =>
    deployToProduction({ cwd: pushCwd, convexArgs: stripCmdFlags(convexArgs) });
````

Edit 4 — final deploy. Anchor: the existing
`// Final deploy — push everything to production\n  if (!deployToProduction(cwd)) {`. Replace
with:

````ts
  // Final deploy — push everything to production, with every caller-passed
  // flag (including --cmd) forwarded.
  if (!deployToProduction({ cwd, convexArgs })) {
````

Everything else in the file (telemetry recording, `generateAndWrite` call, logging) is
unchanged.

#### packages/cli/src/commands/deploy.test.ts

````ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const deployToProduction = vi.fn(() => true);

vi.mock("@vexcms/telemetry", () => ({
  classifyTelemetryError: () => "unknown",
  recordTelemetryEvent: vi.fn(async () => {}),
}));
vi.mock("@vexcms/telemetry/config", () => ({
  anonymizeConfig: ({ config }: { config: unknown }) => config,
}));
vi.mock("../lib/loadConfig.js", () => ({
  loadConfig: vi.fn(async () => ({
    schema: { outputPath: "convex/vex.schema.ts" },
    telemetry: { hideLogs: true },
  })),
}));
vi.mock("../lib/resolveConfigPath.js", () => ({
  resolveConfigPath: vi.fn(() => "/project/vex.config.server.ts"),
  isServerConfigPath: vi.fn(() => true),
}));
vi.mock("../lib/convexProcess.js", async () => {
  const actual = await vi.importActual<typeof import("../lib/convexProcess.js")>("../lib/convexProcess.js");
  return { ...actual, deployToProduction };
});
vi.mock("../lib/generateSchema.js", () => ({
  generateAndWrite: vi.fn(async (_config, cwd, _configPath, options) => {
    // Simulate one auto-migration interim push before the final deploy below.
    await options?.pushSchema?.(cwd);
    return { written: true };
  }),
}));

import { deployCommand } from "./deploy";

describe("deployCommand", () => {
  beforeEach(() => {
    deployToProduction.mockClear();
    deployToProduction.mockReturnValue(true);
  });

  it("strips --cmd from the interim push but keeps it on the final deploy", async () => {
    await deployCommand({ cwd: "/project", convexArgs: ["--cmd", "pnpm build"] });

    expect(deployToProduction).toHaveBeenCalledTimes(2);
    expect(deployToProduction).toHaveBeenNthCalledWith(1, { cwd: "/project", convexArgs: [] });
    expect(deployToProduction).toHaveBeenNthCalledWith(2, { cwd: "/project", convexArgs: ["--cmd", "pnpm build"] });
  });

  it("strips --cmd-url-env-var-name and its value from the interim push only", async () => {
    await deployCommand({
      cwd: "/project",
      convexArgs: ["--cmd", "pnpm build", "--cmd-url-env-var-name", "VITE_CONVEX_URL"],
    });

    expect(deployToProduction).toHaveBeenNthCalledWith(1, { cwd: "/project", convexArgs: [] });
    expect(deployToProduction).toHaveBeenNthCalledWith(2, {
      cwd: "/project",
      convexArgs: ["--cmd", "pnpm build", "--cmd-url-env-var-name", "VITE_CONVEX_URL"],
    });
  });

  it("defaults cwd to process.cwd() when --cwd is not passed", async () => {
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/default/project");
    await deployCommand();
    expect(deployToProduction).toHaveBeenLastCalledWith({ cwd: "/default/project", convexArgs: [] });
    cwdSpy.mockRestore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
````

#### packages/cli/src/lib/convexProcess.ts

Edit 1 — import. Anchor: the existing first line,
`import { execSync, spawn, type ChildProcess } from "node:child_process";`. Replace with:

````ts
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
````

Edit 2 — `deployToProduction` + a new `stripCmdFlags`. Anchor: the existing block

````ts
/**
 * Run `convex deploy` to push to production.
 * @param cwd - Directory to run the `convex deploy` command in.
 * @returns `true` if the deploy succeeded, `false` otherwise.
 */
export function deployToProduction(cwd: string): boolean {
  return runConvexCommand(cwd, ["deploy"]);
}
````

Replace with:

````ts
/**
 * Run `convex deploy` to push to production. Runs with no timeout — unlike
 * every other `convex` command vex runs — because a caller-passed `--cmd`
 * makes the deploy also run the project's own build, which can take
 * much longer than the standard 120-second ceiling.
 * @param props - Input props.
 * @param props.cwd - Directory to run the `convex deploy` command in.
 * @param props.convexArgs - Extra flags forwarded verbatim to `convex
 * deploy` (e.g. `--cmd`, `--preview-create`).
 * @returns `true` if the deploy succeeded, `false` otherwise.
 */
export function deployToProduction(props: { cwd: string; convexArgs?: string[] }): boolean {
  return runConvexCommand(props.cwd, ["deploy", ...(props.convexArgs ?? [])], { timeoutMs: null });
}

/**
 * Strip `--cmd` and `--cmd-url-env-var-name` (and their values) from
 * `convexArgs`, preserving the order of everything else. Used for `vex
 * deploy`'s auto-migration interim pushes so a caller-passed build command
 * runs exactly once, on the final deploy, not on every interim schema push.
 * @param convexArgs - Flags as collected by `parseCliArgs`.
 * @returns `convexArgs` with every `--cmd`/`--cmd-url-env-var-name` pair removed.
 */
export function stripCmdFlags(convexArgs: string[]): string[] {
  const stripped: string[] = [];
  for (let i = 0; i < convexArgs.length; i++) {
    const arg = convexArgs[i];
    if (arg === "--cmd" || arg === "--cmd-url-env-var-name") {
      i++; // also skip the flag's value
      continue;
    }
    stripped.push(arg);
  }
  return stripped;
}
````

Edit 3 — `runConvexCommand`. Anchor: the existing

````ts
function runConvexCommand(cwd: string, convexArgs: string[]): boolean {
  const pm = detectPackageManager(cwd);
  const cmd = [pm.cmd, ...pm.args, "convex", ...convexArgs].join(" ");

  logger.info(`Running: ${cmd}`);
  try {
    execSync(cmd, {
      cwd,
      stdio: "inherit",
      timeout: 120_000,
    });
    logger.success("Convex command succeeded");
    return true;
  } catch (err) {
    const output =
      err && typeof err === "object" && "stderr" in err
        ? String((err as any).stderr).slice(0, 300)
        : "";
    logger.warn(`Convex command failed${output ? `: ${output}` : ""}`);
    return false;
  }
}
````

Replace with (switches `execSync` + a joined command string to `execFileSync` + an argv array,
so an argument containing spaces — e.g. `--cmd "pnpm build"` — is never re-split by a shell;
`timeoutMs` defaults to the existing 120s for every caller except `deployToProduction`, which
passes `null` for no timeout):

````ts
function runConvexCommand(
  cwd: string,
  convexArgs: string[],
  options?: { timeoutMs?: number | null },
): boolean {
  const pm = detectPackageManager(cwd);
  const argv = [...pm.args, "convex", ...convexArgs];
  const timeoutMs = options?.timeoutMs === undefined ? 120_000 : options.timeoutMs;

  logger.info(`Running: ${pm.cmd} ${argv.join(" ")}`);
  try {
    execFileSync(pm.cmd, argv, {
      cwd,
      stdio: "inherit",
      ...(timeoutMs === null ? {} : { timeout: timeoutMs }),
    });
    logger.success("Convex command succeeded");
    return true;
  } catch (err) {
    const output =
      err && typeof err === "object" && "stderr" in err
        ? String((err as any).stderr).slice(0, 300)
        : "";
    logger.warn(`Convex command failed${output ? `: ${output}` : ""}`);
    return false;
  }
}
````

`pushSchemaStandalone` (`runConvexCommand(cwd, ["dev", "--once", "--typecheck", "disable",
"--codegen", "disable"])`) is unchanged — it omits `options`, so it keeps the 120s default.

#### packages/cli/src/lib/convexProcess.test.ts

````ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const execFileSync = vi.fn();

vi.mock("node:child_process", () => ({
  execFileSync,
  spawn: vi.fn(),
}));

import { deployToProduction, stripCmdFlags } from "./convexProcess";

describe("stripCmdFlags", () => {
  it("strips --cmd and its value", () => {
    expect(stripCmdFlags(["--cmd", "pnpm build"])).toEqual([]);
  });

  it("strips --cmd-url-env-var-name and its value", () => {
    expect(stripCmdFlags(["--cmd-url-env-var-name", "VITE_CONVEX_URL"])).toEqual([]);
  });

  it("strips both while keeping unrelated flags, in order", () => {
    expect(
      stripCmdFlags(["--preview-create", "x", "--cmd", "pnpm build", "--cmd-url-env-var-name", "VITE_CONVEX_URL"]),
    ).toEqual(["--preview-create", "x"]);
  });

  it("leaves args with no --cmd flags untouched", () => {
    expect(stripCmdFlags(["--preview-create", "x"])).toEqual(["--preview-create", "x"]);
  });
});

describe("deployToProduction", () => {
  beforeEach(() => {
    execFileSync.mockReset();
  });

  it("passes convexArgs through to the underlying convex deploy call", () => {
    deployToProduction({ cwd: "/project", convexArgs: ["--cmd", "pnpm build"] });

    expect(execFileSync).toHaveBeenCalledTimes(1);
    const [, argv] = execFileSync.mock.calls[0];
    expect(argv).toEqual(expect.arrayContaining(["convex", "deploy", "--cmd", "pnpm build"]));
  });

  it("runs with no timeout, unlike every other convex command", () => {
    deployToProduction({ cwd: "/project" });

    const [, , options] = execFileSync.mock.calls[0];
    expect(options).not.toHaveProperty("timeout");
  });
});
````

#### .changeset/cli-deploy-flag-passthrough.md

````markdown
---
"@vexcms/cli": patch
---

`vex deploy [--cwd <dir>] [convex deploy flags…]` now forwards every flag it doesn't own
straight through to the final `convex deploy` call — `--cmd`, `--preview-create`, and the
rest. `--cwd` stays vex's own (it now actually runs from `<dir>` instead of always using
`process.cwd()`). The auto-migration interim pushes strip `--cmd`/`--cmd-url-env-var-name` so
a custom build command runs once, on the final deploy, not on every interim schema push.
`convex deploy` runs with no timeout (previously 120s) — every other `convex` command vex runs
keeps its 120s timeout.
````

#### apps/docs/src/content/docs/guides/deployment.mdx

````mdx
---
title: Deployment
description: Deploy a VexCMS project's Convex backend to production and the Next.js app to Vercel production, using `vex:deploy`.
sidebar:
  hidden: true
---

This guide covers the two deploys a VexCMS project needs for production: pushing your schema
and functions to a Convex production deployment, and deploying the Next.js app to Vercel with
the right build command and environment variables.

## Prerequisites

- A scaffolded project already running locally — see the [quickstart guide](/guides/quickstart/).
- A Convex account, logged in locally (`npx convex login` if you haven't already).
- A Vercel project connected to this repository (or the Vercel CLI).
- The `vex:deploy` script in `package.json` (`"vex:deploy": "vex deploy"`). Every project
  scaffolded by `create-vexcms@alpha` ships it by default; if yours predates that, add the
  script yourself.

## Deploy Convex to production

```bash
pnpm vex:deploy
```

`vex deploy` resolves `vex.config.server.ts`, regenerates the Convex schema
(`convex/vex.schema.ts`) and types (`src/vex.types.ts`) if they've drifted from your config,
pushes the regenerated schema via `convex deploy` when it changed, then always runs one final
`convex deploy` to push everything — schema, functions, and any pending data migration — to
your linked production deployment.

`vex deploy [--cwd <dir>] [convex deploy flags…]` forwards every flag it doesn't own straight
through to that final `convex deploy` call — `--cmd`, `--preview-create`, and the rest. See
[Passing flags to convex deploy](#passing-flags-to-convex-deploy) below — the Vercel build
command uses exactly this to run `pnpm build` as part of the same deploy.

## Set the production Convex environment

Better Auth runs inside your Convex deployment, not inside the Next.js server, so it never
reads anything from Vercel. Set these on the deployment itself, before or right after your
first `vex:deploy`:

```bash
npx convex env set SITE_URL https://your-prod-domain.example --prod
npx convex env set BETTER_AUTH_SECRET <the same BETTER_AUTH_SECRET you set in Vercel below> --prod
```

If your project added any OAuth providers, their Client ID/Secret pair needs setting here too
— `convex/auth/options.ts` reads them the same way it reads `SITE_URL`:

```bash
npx convex env set GITHUB_CLIENT_ID <value> --prod
npx convex env set GITHUB_CLIENT_SECRET <value> --prod
```

(Swap `GITHUB_*` for whichever provider(s) you selected while scaffolding — the variable names
match your project's own `src/env.mjs` exactly.)

Skipping `SITE_URL`/`BETTER_AUTH_SECRET` here is the same `403` on first sign-in the quickstart
guide warns about, just against the production deployment instead of your local one.

## Seed production (marketing-site starter)

The marketing-site starter ships `pnpm seed` → `convex run seed:init`, an idempotent mutation
that only inserts documents missing from the target deployment. Run it against prod directly:

```bash
npx convex run seed:init --prod
```

A `--bare` project has no `convex/seed.ts` — skip this step.

## Deploy the Next.js app to Vercel (production)

### Environment variables

Set every variable `src/env.mjs`'s schema requires, for the **Production** environment:

| Variable | Scope | Value |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | client | injected automatically by `--cmd` (below) — set it by hand only if you deploy without `--cmd` |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | client | the prod deployment's `.convex.site` URL — `--cmd` does not inject this one |
| `NEXT_PUBLIC_SITE_URL` | client | your production domain |
| `SITE_URL` | server | same value as `NEXT_PUBLIC_SITE_URL` |
| `BETTER_AUTH_SECRET` | server | the same value set on Convex above |
| any OAuth `*_CLIENT_ID` / `*_CLIENT_SECRET` your project added | server | the same values set on Convex above |
| `CONVEX_DEPLOY_KEY` | server, **Production** scope only | a **Production**-scoped deploy key for this project, from the Convex dashboard → Settings → Deploy Keys |

`CONVEX_DEPLOY_KEY` is what the `convex deploy` call inside `vex:deploy` authenticates with
when it runs as part of the Vercel build — without it, the build command below fails before it
ever reaches `pnpm build`. Scope it to **Production** only: a Preview build should never be
able to push schema to your real deployment.

### Build command

Override Vercel's build command (Project → Settings → Build and Deployment) to:

```
pnpm vex:deploy --cmd 'pnpm build'
```

This is `vex deploy`'s version of
[Convex's own "Using Convex with Vercel" recipe](https://docs.convex.dev/production/hosting/vercel):
`--cmd` runs the deploy, then runs `pnpm build` with the resulting Convex URL injected into its
environment — the same as `npx convex deploy --cmd 'npm run build'` does, just running through
`vex deploy` first so your schema generation and auto-migration happen before the build.
`--cmd` infers and injects `NEXT_PUBLIC_CONVEX_URL` for a Next.js build automatically; rename
the injected variable with `--cmd-url-env-var-name <name>` if your build can't infer it.
`NEXT_PUBLIC_CONVEX_SITE_URL` isn't something `--cmd` knows how to inject — set it as an
ordinary Vercel Production environment variable (above).

### Install command

Vercel's default (`pnpm install`) is correct — no override needed.

## Create your first admin

Same as local: visit the production URL and sign up. The first account created on *that*
Convex deployment is auto-promoted to admin (`convex/vex/firstUser.ts`) — this is tracked
per deployment, so your first production sign-up is a separate "first" from your dev
deployment's.

## Closing sign-up (optional)

Once every account the deployment needs exists, you can close public sign-up without touching
code — read a Convex env var in your own `convex/auth/options.ts` and set Better Auth's
`emailAndPassword.disableSignUp` from it, for example an env var named `AUTH_DISABLE_SIGN_UP`:

```ts
// convex/auth/options.ts
emailAndPassword: {
  enabled: true,
  disableSignUp: process.env.AUTH_DISABLE_SIGN_UP === "true",
  // ...your other emailAndPassword options
},
```

Then, once you've signed up yourself (above) and created every other account the deployment
needs:

```bash
npx convex env set AUTH_DISABLE_SIGN_UP true --prod
```

`POST /api/auth/sign-up/email` now returns an error status on this deployment; existing
accounts can still sign in. Reverse it with
`npx convex env set AUTH_DISABLE_SIGN_UP false --prod`.

## Live preview on production

Both starters mount the admin panel and the public site on the same Vercel domain by default,
so live preview needs no extra configuration. If you move the admin to a different origin from
the public site, add that production origin to `livePreview.allowedOrigins` in `vex.config.ts`
before deploying — an empty allowlist disables the cross-origin `postMessage` transport
entirely.

## Revalidation on production

Nothing to configure. `POST /api/vex/revalidate` (`createVexRevalidateRoute`) is
session-authorized, not secret-authorized: the caller must already hold a signed-in session,
and the route re-checks `hasPermission` against the affected collection server-side before
purging anything. There's no shared-secret environment variable to set for production — see
[Caching, sitemaps and revalidation](/guides/caching-and-seo/) for how the route itself works.

## Passing flags to convex deploy

`vex deploy [--cwd <dir>] [convex deploy flags…]` forwards every flag it doesn't own straight
through to the final `convex deploy` call — `--cmd`, `--cmd-url-env-var-name`,
`--preview-create`, `--preview-run`, anything
[`convex deploy`](https://docs.convex.dev/cli/reference/deploy) accepts. `--cwd <dir>` is the
one flag `vex` itself owns: it runs as if started from `<dir>` instead of `process.cwd()`, and
it is never forwarded to `convex deploy` (which has no `--cwd` of its own).

The auto-migration interim pushes (the ones that run only when your schema changed and the
migration needs more than one deploy to converge) strip `--cmd` and `--cmd-url-env-var-name`
before forwarding the rest — so your build command runs exactly once, on the final deploy,
never on an interim schema-only push.

`convex deploy` runs with no timeout when `vex deploy` calls it (every other `convex` command
`vex` runs — `dev`, the standalone schema push — keeps a 120-second timeout): a deploy that
also runs your build command (`--cmd`) can take much longer than 120 seconds, and `vex deploy`
would otherwise report it as failed before it finished.

## What vex deploy does not do

- **No migration sequencing beyond schema generation.** It regenerates and pushes the Convex
  schema/types; it does not run or order your own data migrations.
- **No environment-variable management.** It neither reads nor writes Vercel or Convex
  environment variables itself — every value on this page is set by hand (or by your own CI
  secrets, or by `--cmd`'s own URL injection above), never by `vex deploy` directly.
- **No Vercel step of its own.** `vex deploy` only talks to Convex. `pnpm build` (run directly,
  or through `--cmd` above) is Vercel's own build step, not something `vex deploy` runs unless
  you pass `--cmd`.
````

#### apps/docs/src/content/docs/guides/access-control.mdx

decision 15 fix: `withIndex`'s raw `(ix) => ix.eq("authorId", user._id)` examples compare the bare id
against the field's actual list-stored value and never match — `indexedOwnerCheck`
(`packages/core/src/access/buildChecks.ts`) handles this itself by wrapping relationship
fields' comparison value in `[user._id]` before calling `ix.eq`, confirming the field really is
stored as an array. The `where: ({ user, q }) => q.eq("authorId", user._id)` examples (two
further down the page) are **not** broken: `find`/`search` run `normalizeArrayStoredWhere`
(`packages/core/src/db/queryArgs.ts`) on every `where` node — including ones a `where` access
check contributes — before the query runs, and that function wraps a single-cardinality
relationship field's `eq` value in a one-element array automatically (confirmed in
`queryArgs.test.ts`'s `normalizeArrayStoredWhere` suite). `withIndex`'s raw `range` callback
bypasses that normalization entirely — it calls `ix.eq` directly against Convex's own
`IndexRange`, which is why only the `withIndex` examples and the plain-callback comparison
below need the explicit `[user._id]`/`.includes()` fix.

Edit 1 — first `withIndex` example. Anchor: the existing

````ts
posts: {
  read: {
    withIndex: ({ user }) => ({ name: "by_authorId", range: (ix) => ix.eq("authorId", user._id) }),
  },
}
````

(the one directly under "Read, pushed through a declared index — `ix` checks field order
against the index at compile time:"). Replace with:

````ts
posts: {
  read: {
    withIndex: ({ user }) => ({ name: "by_authorId", range: (ix) => ix.eq("authorId", [user._id]) }),
  },
}
````

Edit 2 — combined `withIndex` + `where` example. Anchor: the existing

````ts
posts: {
  read: {
    withIndex: ({ user }) => ({ name: "by_authorId", range: (ix) => ix.eq("authorId", user._id) }),
    where: ({ q }) => q.neq("status", "archived"),
  },
}
````

(the one under "Both together — `withIndex` narrows to the caller's rows..."). Replace with:

````ts
posts: {
  read: {
    withIndex: ({ user }) => ({ name: "by_authorId", range: (ix) => ix.eq("authorId", [user._id]) }),
    where: ({ q }) => q.neq("status", "archived"),
  },
}
````

Edit 3 — plain-callback example + new note. Anchor: the existing

````ts
posts: {
  read: true,
  create: true,
  update: ({ user, data }) => data?.authorId === user._id,
  delete: ({ user, data }) => data?.authorId === user._id,
}
````

(under "### 2. A plain callback — the escape hatch"). Replace the code block with:

````ts
posts: {
  read: true,
  create: true,
  update: ({ user, data }) => data?.authorId?.includes(user._id),
  delete: ({ user, data }) => data?.authorId?.includes(user._id),
}
````

and append this paragraph immediately after the replaced code block (before the "### 3. Boolean
shorthand" heading):

````markdown
**Relationship values are lists.** A `relationship` field is stored as `Id[]` regardless of
`hasMany` — a single relationship is a one-element array, not a bare id — so a plain-JS
comparison needs `data?.authorId?.includes(user._id)`, never `data?.authorId === user._id`.
`withIndex`'s raw `range` callback has the same requirement: wrap the comparison value yourself
(`ix.eq("authorId", [user._id])`), because unlike `where`, it bypasses the normalization that
makes a bare `q.eq("authorId", user._id)` work inside `where`. When in doubt, reach for
`indexedOwnerCheck`/`ownerPredicateCheck` (`@vexcms/core`'s access helpers) instead of writing
either form by hand — they get the field's shape right for you.
````

Verify: `pnpm --filter @vexcms/cli test` exits 0 — every new assertion passes, including the
interim-vs-final-push distinction; `pnpm --filter @vexcms/cli typecheck` exits 0; **negative
check**: temporarily change `commands/deploy.ts`'s interim `pushSchema` to forward `convexArgs`
unstripped (drop the `stripCmdFlags(...)` call) — `deploy.test.ts`'s "strips --cmd from the
interim push" test must fail; restore the strip and confirm it passes again. `pnpm --filter
docs build` exits 0; `/guides/deployment/` is in the sidebar after Quickstart; every command in
the guide exists (`vex deploy` in `packages/cli/src/index.ts`, `vex:deploy` after Step 4);
`rg -n "ix.eq\(\"authorId\", user._id\)|data\?.authorId === user._id" apps/docs/src/content/docs/guides/access-control.mdx`
prints nothing.

#### apps/docs/astro.config.mjs

Edit 1 — hide the new page from the autogenerated Guides group and place it in the Next.js
group, after Quickstart. Anchor: the `'Next.js'` sidebar item block's `items` array, currently:

````js
				{
					label: 'Next.js',
					items: [
						{ label: 'Quickstart', slug: 'guides/quickstart' },
						{ label: 'Caching, sitemaps & revalidation', slug: 'guides/caching-and-seo' },
					],
				},
````

Replace with (adds `Deployment` immediately after `Quickstart`):

````js
				{
					label: 'Next.js',
					items: [
						{ label: 'Quickstart', slug: 'guides/quickstart' },
						{ label: 'Deployment', slug: 'guides/deployment' },
						{ label: 'Caching, sitemaps & revalidation', slug: 'guides/caching-and-seo' },
					],
				},
````

#### apps/docs/src/content/docs/guides/quickstart.mdx

Anchor: the `## Next steps` section's last bullet, currently ending "...the root
[README's manual setup section](https://github.com/ianyimi/vex#manual-setup)." Append a new
bullet immediately after it:

````markdown
- Ready to go live? See the [deployment guide](/guides/deployment/) for Convex production and
  a Vercel production deploy.
````

Verify: `pnpm --filter docs build` exits 0; `/guides/deployment/` is in the sidebar after
Quickstart; every command in the guide exists (`vex deploy` in `packages/cli/src/index.ts`,
`vex:deploy` after Step 4).

### Step 4 — Templates: `vex:deploy` script + README Deployment [agent]

Why: the scaffold README says `npx convex deploy` and ships no `vex:deploy` script; the guide
and the templates must agree before alpha.35 is cut.

Waits for: GU-3 (`vex deploy` flag passthrough) done; DEP (`2026-11-07-pre-launch-dependency-upgrades`)
done — both edit `templates/base-nextjs/package.json`. alpha.35 is published after this step.

`marketing-site` has no own `package.json` or `README.md` — it's a file-level overlay on
`base-nextjs` (`packages/create-vexcms/README.md` § Templates), so both scripts/doc edits below
cover it automatically. No `create-vexcms` test asserts the README's/`package.json`'s exact
content, so none need updating.

- [ ] `packages/create-vexcms/templates/base-nextjs/package.json` — `vex:deploy`
- [ ] `packages/create-vexcms/templates/base-nextjs/README.md` — § Deployment
- [ ] `packages/create-vexcms/README.md` — scripts table + deployment pointer
- [ ] `.changeset/create-vexcms-deploy-script.md` (`patch`, P-025)

#### packages/create-vexcms/templates/base-nextjs/package.json

Anchor: the `"scripts"` object's `"seed"` entry (`"seed": "convex run seed:init",`). Insert a
new entry immediately after it:

````json
    "vex:deploy": "vex deploy",
````

#### packages/create-vexcms/templates/base-nextjs/README.md

Anchor: the `## Deployment` heading and its three-step list (the file's last section,
currently steps 1–3 starting with `1. \`npx convex deploy\``). Replace the whole section:

````markdown
## Deployment

See the [deployment guide](https://docs.vexcms.dev/guides/deployment/) for the full walkthrough
(production Convex env, Vercel env vars, build command). Short version:

```bash
pnpm vex:deploy
```

pushes your schema and deploys to Convex production. Then deploy this app to Vercel with the
build command `pnpm vex:deploy --cmd 'pnpm build'`, and `CONVEX_DEPLOY_KEY` set to a
**Production**-scoped deploy key.
````

#### packages/create-vexcms/README.md

Edit 1 — scripts table. Anchor: the `### Available scripts` table's last row,
`| \`pnpm secret:create\` | ... |`. Insert a new row immediately after it:

````markdown
| `pnpm vex:deploy` | Generate schema/types and deploy to Convex production |
````

Edit 2 — deployment pointer. Anchor: insert a new `## Deployment` section immediately before
the existing `## Telemetry` heading:

````markdown
## Deployment

See the [deployment guide](https://docs.vexcms.dev/guides/deployment/) — Convex production via
`pnpm vex:deploy`, then a Vercel production deploy with the build command
`pnpm vex:deploy --cmd 'pnpm build'`.

````

#### .changeset/create-vexcms-deploy-script.md

````markdown
---
"create-vexcms": patch
---

`base-nextjs` (and the `marketing-site` overlay, which inherits its `package.json`) now ships a
`vex:deploy` script (`vex deploy`) instead of only documenting `npx convex deploy` in the
README. The scaffold README's `## Deployment` section and the root `create-vexcms` README now
point at the new [deployment guide](https://docs.vexcms.dev/guides/deployment/) and the
`pnpm vex:deploy --cmd 'pnpm build'` Vercel build command instead of a three-step
`npx convex deploy` recipe.
````

Verify: `node scripts/verify-scaffold.mjs`, `node scripts/scaffold-smoke.mjs --bare`,
`node scripts/scaffold-smoke.mjs` exit 0; both scaffolds' `package.json` carry
`"vex:deploy": "vex deploy"`; `rg -n "npx convex deploy" packages/create-vexcms` prints nothing.

### Step 5 — Examples repo skeleton [agent]

Why: one private, clonable home for the four scenarios, with CI that catches alpha bumps.

Waits for: human — private `vexcms/examples` created and cloned to
`~/Documents/Projects/vexcms-examples`.

Every path below is relative to the clone root (`~/Documents/Projects/vexcms-examples`), not
this monorepo. All five are new files — the clone is empty before this step.

- [ ] `README.md`
- [ ] `LICENSE`
- [ ] `NOTICE`
- [ ] `.gitignore`
- [ ] `.github/workflows/ci.yml`

#### README.md

````markdown
# VexCMS examples

Four standalone [VexCMS](https://github.com/ianyimi/vex) projects, each a complete scaffold
built from `pnpm create vexcms@alpha` and carried through to a Convex production deployment and
a Vercel production deploy. They back VexCMS's live demos and recorded clips — one domain per
scenario, independent lockfiles, exactly what a stranger gets from the scaffolder.

## The four examples

| Folder | Domain | Template |
|---|---|---|
| `magazine/` | Editorial / articles | `--bare` |
| `real-estate/` | Listings | `--bare` |
| `conference/` | Event site | marketing-site |
| `restaurant/` | Menus / locations | marketing-site |

Each folder is scaffolded, built and deployed independently — check back as each one lands;
an empty folder here means that scenario hasn't been built yet.

## Coverage

Together the four examples exercise every feature VexCMS ships, except multi-tenant
organizations (`--orgs`) and a custom storage adapter — see
[the feature reference](https://docs.vexcms.dev) for what's shipped and what isn't.

### Not shipped (never faked here)

| Gap | Tracking |
|---|---|
| Localization | [#59](https://github.com/ianyimi/vex/issues/59) |
| Scheduled publishing | [#63](https://github.com/ianyimi/vex/issues/63) |
| TanStack Start adapter | [#64](https://github.com/ianyimi/vex/issues/64) |
| Form builder (visitor submissions) | [#57](https://github.com/ianyimi/vex/issues/57) |
| Outbound webhooks | [#60](https://github.com/ianyimi/vex/issues/60) |
| API keys + team management (invites) | [#53](https://github.com/ianyimi/vex/issues/53) |
| Brownfield adoption | [#54](https://github.com/ianyimi/vex/issues/54) |
| Plugin system | [#61](https://github.com/ianyimi/vex/issues/61) |

## Live demos

Filled in at Step 26, once every scenario has a Convex production deployment and a Vercel
production deploy (production deployments stay live — they are not torn down after recording).

| Scenario | Live site | Admin |
|---|---|---|
| Magazine | _pending — Step 26_ | _pending — Step 26_ |
| Real estate | _pending — Step 26_ | _pending — Step 26_ |
| Conference | _pending — Step 26_ | _pending — Step 26_ |
| Restaurant | _pending — Step 26_ | _pending — Step 26_ |

## Running one example

```bash
cd magazine   # or real-estate/, conference/, restaurant/
pnpm install
npx convex dev --once
pnpm vex:dev    # terminal 1
pnpm dev        # terminal 2
```

Sign up from the running app — the first account created is automatically promoted to admin.
See each folder's own README once it's scaffolded, and the
[quickstart guide](https://docs.vexcms.dev/guides/quickstart/) for the full walkthrough.

## Versions

Every `@vexcms/*` and `create-vexcms` dependency in every folder is pinned to an exact
published version (no `^`/`~`, no workspace link) — currently `0.1.0-alpha.35`. Nothing here
resolves against unpublished source.

## License

Apache-2.0 — see [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
````

**LICENSE**

The full Apache-2.0 text is identical to the main VexCMS repo's — copy it rather than
retyping it:

```bash
cp ~/Documents/Projects/vex.git/dev/LICENSE ~/Documents/Projects/vexcms-examples/LICENSE
```

- [ ] `LICENSE` — Apache License, Version 2.0, copied verbatim via the command above (adjust
      the source path if the monorepo clone lives elsewhere).

**NOTICE**

````markdown
VexCMS Examples
Copyright 2026 Isaiah Anyimi

This product includes software built on VexCMS (https://github.com/ianyimi/vex).
````

**.gitignore**

````gitignore
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.
# One root .gitignore applies to every independent folder (magazine/, real-estate/,
# conference/, restaurant/) — each is a standalone scaffold, not a pnpm workspace.

# dependencies
/**/node_modules
/**/.pnp
/**/.pnp.*
/**/.yarn/*
!/**/.yarn/patches
!/**/.yarn/plugins
!/**/.yarn/releases
!/**/.yarn/versions

# next.js
/**/.next/
/**/out/

# production
/**/build

# misc
/**/.DS_Store
/**/*.pem

# debug
/**/npm-debug.log*
/**/yarn-debug.log*
/**/yarn-error.log*
/**/.pnpm-debug.log*

# env files
/**/.env
/**/.env.*
!/**/.env.example

# vercel
/**/.vercel

# typescript
/**/*.tsbuildinfo
/**/next-env.d.ts
````

#### .github/workflows/ci.yml

Matrix is discovered dynamically so the very first push (before any example folder exists)
runs an empty matrix instead of erroring on one. Action versions pinned to the same SHAs the
monorepo's own `.github/workflows/ci.yml` uses.

````yaml
name: CI

on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  discover:
    name: Discover example folders
    runs-on: ubuntu-latest
    outputs:
      folders: ${{ steps.list.outputs.folders }}
    steps:
      - name: Checkout
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1

      - name: List folders with a package.json
        id: list
        run: |
          folders=$(find . -maxdepth 2 -mindepth 2 -name package.json \
            -not -path './.github/*' \
            -printf '%h\n' | sed 's#^\./##' | sort | jq -R . | jq -sc .)
          echo "folders=$folders" >> "$GITHUB_OUTPUT"
          echo "Discovered: $folders"

  ci:
    name: CI (${{ matrix.folder }})
    needs: discover
    if: needs.discover.outputs.folders != '[]'
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        folder: ${{ fromJson(needs.discover.outputs.folders) }}
    defaults:
      run:
        working-directory: ${{ matrix.folder }}
    steps:
      - name: Checkout
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1

      - name: Setup pnpm
        uses: pnpm/action-setup@fc06bc1257f339d1d5d8b3a19a8cae5388b55320 # v4.4.0

      - name: Setup Node.js
        uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version: 22
          cache: "pnpm"
          cache-dependency-path: ${{ matrix.folder }}/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint
````

Verify: `actionlint .github/workflows/ci.yml` clean (checked locally with actionlint 1.7.12 —
0 findings); the first push runs `ci` green with an empty matrix (the `discover` job succeeds
with `folders=[]`, and the `ci` job's `if` guard skips it rather than failing on an empty
matrix).

### Step 6 — Magazine 01: scaffold on alpha.35 [agent] — needs developer exception

Why: scenario 1 starts exactly where a stranger starts; this is the D5 clip's first half.

Waits for: GU-5, alpha.35 published, exception granted.

- [ ] Precondition: every `@vexcms/*` package + `create-vexcms` `alpha` dist-tag reads `0.1.0-alpha.35`
- [ ] `pnpm create vexcms@alpha magazine --bare` (answers below), port 3200
- [ ] `package.json` — pin every `@vexcms/*` dependency/devDependency to the exact `0.1.0-alpha.35` (strip the `~` range)
- [ ] Convex project `vex-example-magazine` linked; env set on the deployment
- [ ] `pnpm vex:dev` + `pnpm dev`; first sign-up becomes admin
- [ ] confirm and record the `--bare` seed-script gap (`"seed": "convex run seed:init"` with no `convex/seed.ts` yet)
- [ ] `git tag magazine/01-scaffold && git push origin magazine/01-scaffold`

**Precondition — every alpha.35 tag**

```bash
for pkg in core react next better-auth file-storage-convex richtext-plate cli create-vexcms; do
  echo -n "@vexcms/$pkg: "; npm view "@vexcms/$pkg" dist-tags.alpha
done
```

Every line must print `0.1.0-alpha.35`. Stop and escalate (don't scaffold) if any package still
reads `0.1.0-alpha.34` or older — Design Decision 7 requires every `@vexcms/*` and `create-vexcms`
alpha tag to agree before the examples repo pins exact versions.

**Scaffold — exact prompt answers**

```bash
cd ~/Documents/Projects/vexcms-examples
pnpm create vexcms@alpha magazine --bare
```

| # | Prompt | Answer |
|---|---|---|
| 1/8 | What is your project named? | `magazine` (already supplied as the CLI arg — this prompt is skipped) |
| 2/8 | Select a framework: | Next.js (Recommended) |
| 3/8 | Dev server port: | `3200` |
| 4/8 | Enable email/password authentication? | Yes |
| 5/8 | Enable multi-tenant (organizations)? | No |
| 6/8 | Select OAuth providers (space to toggle, enter to confirm): | none selected — press enter |
| 7/8 | Initialize a Git repository? | No — `magazine/` scaffolds inside the already-git-tracked `vexcms-examples` repo; a second nested `.git` would break the repo's own tags/CI. Check the CLI's behavior here first: `initGit: false` must skip `git init` entirely and leave the parent repo's tree alone, not initialize-then-discard |
| 8/8 | Install dependencies? | Yes |

`--bare` is a CLI flag, not one of the 8 prompts (`packages/create-vexcms/src/index.ts`).

#### magazine/package.json

Numbered edit (every `@vexcms/*` dependency/devDependency currently resolves `~0.1.0-alpha.35` —
Design Decision 7 pins exact, not a range):

1. — For every key under `dependencies` and `devDependencies` matching `@vexcms/*`, strip the
   leading `~` so the version string is the bare `0.1.0-alpha.35`.

```json
"@vexcms/better-auth": "0.1.0-alpha.35",
"@vexcms/core": "0.1.0-alpha.35",
"@vexcms/file-storage-convex": "0.1.0-alpha.35",
"@vexcms/next": "0.1.0-alpha.35",
"@vexcms/react": "0.1.0-alpha.35",
"@vexcms/cli": "0.1.0-alpha.35",
```

2. — `pnpm install` after the edit so the lockfile agrees.

**Stand up the deployment**

```bash
npx convex dev --once
```

Creates/links the Convex project — name it `vex-example-magazine` at the prompt. Writes
`NEXT_PUBLIC_CONVEX_URL`/`NEXT_PUBLIC_CONVEX_SITE_URL`/`CONVEX_DEPLOYMENT` into `.env.local`.

```bash
npx convex env set SITE_URL http://localhost:3200
npx convex env set BETTER_AUTH_SECRET <the BETTER_AUTH_SECRET value from .env.local>
```

Two terminals:

```bash
# Terminal 1
pnpm vex:dev
# Terminal 2
pnpm dev
```

Visit `http://localhost:3200`, click **Create Admin Account**, sign up. First sign-up is
auto-promoted to admin and redirected to `/admin` — confirm `roles` includes `admin`.

**Record — `--bare` seed-script gap**

`package.json` ships `"seed": "convex run seed:init"` from the template, but `convex/seed.ts`
does not exist yet on a fresh `--bare` scaffold — `pnpm seed` fails until Step 9 adds the file.
Record this in the run-through (`golden-runthrough.md` § magazine) as the known, by-design state
at this tag — not a bug to fix here (Step 9 closes it).

**Tag**

```bash
git add -A
git commit -m "magazine: 01-scaffold"
git tag magazine/01-scaffold
git push origin main magazine/01-scaffold
```

Verify: run-through rows "scaffold", "vex dev generates", "first sign-up is admin" pass; tag
`magazine/01-scaffold` pushed

### Step 7 — Magazine 02: collections and fields [dev] — needs developer exception

Why: the D3 story — one config becomes the Convex schema, the types and the admin.

Guided stubs per `code-rules.md`: each `defineCollection` compiles (slug, labels, admin.icon,
versions/livePreview where relevant) with every field left as a numbered `// TODO:` naming its
exact factory and options — the developer fills the field bodies in on camera.

- [ ] `pnpm add @vexcms/richtext-plate@0.1.0-alpha.35`
- [ ] `magazine/src/db/constants/index.ts` — `TABLE_SLUG_CATEGORIES`, `TABLE_SLUG_ARTICLES`
- [ ] `magazine/src/vexcms/collections/users.ts` — byline fields (decision 22)
- [ ] `magazine/src/vexcms/collections/categories.ts`
- [ ] `magazine/src/vexcms/collections/articles.ts`
- [ ] `magazine/src/vexcms/collections/index.ts`
- [ ] `magazine/src/vex.config.ts` — `editor: plateEditor()`, register the two new collections
- [ ] `pnpm typecheck`; `pnpm vex:dev` regenerates `convex/vex.schema.ts` + `src/vex.types.ts`
- [ ] `git tag magazine/02-collections && git push origin magazine/02-collections`

#### magazine/src/db/constants/index.ts

1 edit — add two table-slug constants beside the existing `TABLE_SLUG_IMAGES` line:

```ts
export const TABLE_SLUG_CATEGORIES = "categories" as const
export const TABLE_SLUG_ARTICLES = "articles" as const
```

#### magazine/src/vexcms/collections/users.ts

Edit — decision 22: magazine drops the separate `authors` profile collection entirely. Byline
fields live on the user row itself (`articles.author` points straight at `TABLE_SLUG_USERS`,
Step 7's `articles.ts` below). `name` already exists on the scaffolded `users.ts` and doubles as
the byline display name — no separate `displayName` field needed.

```ts
import { defineCollection, text } from "@vexcms/core"

import { TABLE_SLUG_IMAGES, TABLE_SLUG_USERS } from "~/db/constants"

export const users = defineCollection({
  slug: TABLE_SLUG_USERS,
  admin: {
    useAsTitle: "name",
    icon: "Users",
  },
  labels: {
    singular: "User",
    plural: "Users",
  },
  fields: {
    name: text({ label: "Name", required: true }),
    // TODO 1: slug — text({ label: "Slug", index: "by_slug",
    //   description: "Public byline URL path segment, e.g. mina-oduya. Only set for an account
    //   that publishes articles — admin/editor accounts can leave it blank." })
    // TODO 2: bio — textarea({ label: "Bio", description: "Shown on the public author page." })
    // TODO 3: avatar — upload({ to: TABLE_SLUG_IMAGES, label: "Avatar", accept: "image/*" })
  },
})
```

#### magazine/src/vexcms/collections/categories.ts

```ts
import { defineCollection } from "@vexcms/core"

import { TABLE_SLUG_CATEGORIES } from "~/db/constants"

export const categories = defineCollection({
  slug: TABLE_SLUG_CATEGORIES,
  interfaceName: "Category",
  labels: {
    singular: "Category",
    plural: "Categories",
  },
  admin: {
    useAsTitle: "title",
    icon: "Tag",
  },
  fields: {
    // TODO 1: title — text({ label: "Title", required: true })
    // TODO 2: slug — text({ label: "Slug", required: true, index: "by_slug",
    //   description: "URL path segment, e.g. technology." })
    // TODO 3: description — textarea({ label: "Description" })
  },
})
```

#### magazine/src/vexcms/collections/articles.ts

Drafts + autosave + live preview at `/articles/<slug>` — the D2 story. `author` is a single
relationship straight to the signed-in account (decision 22 — magazine drops the separate
`authors` profile collection; ownership = user). `readOwn`/`ownOnly` (Step 8) index `author`
directly via `indexedOwnerCheck`/`ownerPredicateCheck` — no `beforeChange` denormalization, no
second hop, because `author` already names the Better Auth account, not a byline-only row.

```ts
import { defineCollection } from "@vexcms/core"

import { TABLE_SLUG_ARTICLES } from "~/db/constants"

export const articles = defineCollection({
  slug: TABLE_SLUG_ARTICLES,
  interfaceName: "Article",
  labels: {
    singular: "Article",
    plural: "Articles",
  },
  admin: {
    useAsTitle: "title",
    icon: "Newspaper",
    livePreview: {
      url: (doc) => `/articles/${doc.slug}`,
    },
  },
  versions: {
    drafts: true,
    autosave: { enabled: true },
  },
  fields: {
    // TODO 1: title — text({ label: "Title", required: true })
    // TODO 2: slug — text({ label: "Slug", required: true, index: "by_slug",
    //   description: "URL path segment, e.g. the-fold-is-dead." })
    //   → Step 8 adds a `validate` option here (slug uniqueness, VexError)
    // TODO 3: excerpt — textarea({ label: "Excerpt",
    //   description: "Shown on the articles index and as the meta description." })
    // TODO 4: body — richtext({ label: "Body", mediaCollectionSlug: TABLE_SLUG_IMAGES, required: true })
    // TODO 5: cover — upload({ to: TABLE_SLUG_IMAGES, label: "Cover Image", accept: "image/*",
    //   admin: { position: "sidebar" } })
    // TODO 6: author — relationship({ collection: { slug: TABLE_SLUG_USERS }, label: "Author",
    //   required: true })  (auto-indexes "by_author")
    // TODO 7: categories — relationship({ collection: { slug: TABLE_SLUG_CATEGORIES },
    //   label: "Categories", hasMany: true })
    // TODO 8: publishedAt — date({ label: "Published At",
    //   description: "When this article went live." })
    // TODO 9: featured — checkbox({ label: "Featured",
    //   description: "Pins this article to the homepage hero." })
    // TODO 10: readingTime — number({ label: "Reading Time (minutes)", admin: { readOnly: true },
    //   description: "Computed from body's word count by the beforeChange hook — never hand-edited." })
  },
})
```

#### magazine/src/vexcms/collections/index.ts

1 edit — append the two new barrel exports beside the existing two:

```ts
export * from "./categories"
export * from "./articles"
```

#### magazine/src/vex.config.ts

2 edits.

1 — imports: add `plateEditor` and the two new collections.

```ts
import { plateEditor } from "@vexcms/richtext-plate"

import { articles, categories, images, users } from "~/vexcms/collections"
```

2 — the `defineConfig({ … })` call: add `editor` and extend `collections`.

```ts
const vexConfig = defineConfig({
  access,
  authCollections: betterAuthCollections(authSchema),
  editor: plateEditor(),
  admin: {
    sidebar: { side: "right" },
  },
  storage: {
    clientUploads: { convex: uploadFile },
  },
  collections: [users, categories, articles],
  mediaCollections: [images],
})
```

Verify: `pnpm typecheck` 0; `vex dev` regenerates `convex/vex.schema.ts` + `src/vex.types.ts` with
`Article`/`Category`; admin's extended `Users` collection shows the byline fields; tag `magazine/02-collections`

### Step 8 — Magazine 03: access, hooks, validation, slots [dev] — needs developer exception

Why: the D4 story — authors edit only their own drafts, editors publish, the server rejects a
duplicate slug.

- [ ] `magazine/src/db/constants/auth.ts` — `USER_ROLES.editor`, `USER_ROLES.author`
- [ ] `magazine/src/auth/permissions.ts` (new)
- [ ] `magazine/src/auth/access.ts`
- [ ] `magazine/convex/auth/options.ts` — `AUTH_DISABLE_SIGN_UP` (decision 21)
- [ ] `magazine/src/vexcms/collections/articles.ts` — `hooks.beforeChange`, `slug.validate`
- [ ] `magazine/src/vexcms/admin/CopyPublicLinkAction.tsx` (new)
- [ ] `magazine/src/vex.config.ts` — `edit.header.actions` contribution
- [ ] `git tag magazine/03-access && git push origin magazine/03-access`

#### magazine/src/db/constants/auth.ts

1 edit — base scaffolds `USER_ROLES = { admin, user }`; add the two staff roles (`user` stays
as the public/anonymous-reader role — `anonRole` resolves there, same as base).

```ts
export const USER_ROLES = {
  admin: "admin",
  editor: "editor",
  author: "author",
  user: "user",
} as const
```

#### magazine/src/auth/permissions.ts

New file — thin, reusable wrappers around `@vexcms/core`'s owner-check builders. Full code: pure
composition, no project-specific judgment (that lives in `access.ts`'s permission matrix below).

```ts
import type {
  AccessCheck,
  AccessDocFieldFor,
  AccessIndexedFieldFor,
  AccessMutationCheck,
  AccessResourceRef,
  CollectionSlug,
} from "@vexcms/core"
import { indexedOwnerCheck, ownerPredicateCheck } from "@vexcms/core"

/**
 * Allow a mutation only on rows the requesting user owns.
 *
 * @param resource - The resource this check governs.
 * @param field - The owner field, e.g. `"author"`.
 * @returns A per-document check for a non-query action.
 */
export function ownOnly<S extends CollectionSlug, F extends AccessDocFieldFor<S>>(
  resource: AccessResourceRef<S>,
  field: F,
): AccessMutationCheck<S> {
  return ownerPredicateCheck({ field, resource })
}

/**
 * Read only the rows the requesting user owns, narrowed through the owner field's index.
 *
 * @param resource - The resource this check governs.
 * @param field - The owner field, e.g. `"author"`.
 * @returns A check assignable to `read`/`readDrafts`.
 */
export function readOwn<S extends CollectionSlug, F extends AccessIndexedFieldFor<S>>(
  resource: AccessResourceRef<S>,
  field: F,
): AccessCheck<S> {
  return indexedOwnerCheck({ field, resource })
}

/**
 * Allow a mutation only on rows the requesting user owns, restricting the
 * writable fields to `fieldMap` when it does.
 *
 * @param resource - The resource this check governs.
 * @param field - The owner field, e.g. `"author"`.
 * @param fieldMap - The field map returned for an owned row; denied rows return `false`.
 * @returns A per-document check for a non-query action.
 */
export function ownOnlyFields<S extends CollectionSlug, F extends AccessDocFieldFor<S>>(
  resource: AccessResourceRef<S>,
  field: F,
  fieldMap: Record<string, boolean>,
): AccessMutationCheck<S> {
  const isOwner = ownerPredicateCheck({ field, resource })
  return ((props) => (isOwner(props) ? fieldMap : false)) as AccessMutationCheck<S>
}
```

#### magazine/src/auth/access.ts

Full rewrite of the scaffolded default. Guided stub: `defineAccess`'s structural shape (roles,
resources, the `permissions` object's role keys) compiles; each role's resource matrix is a
numbered `// TODO:` list naming the exact check.

**Author↔user link, chosen and justified**: `articles.author` points directly at the signed-in
account (`TABLE_SLUG_USERS`) — decision 22 drops the separate `authors` profile collection, so
there is no second hop. `readOwn`/`ownOnly` index `author` directly via
`indexedOwnerCheck`/`ownerPredicateCheck`, with no `beforeChange` denormalization. The public
author page (`/authors/[slug]`, Step 10) does NOT read through a widened `users.read` rule: the
`user` role's existing own-row check below (`by_email`, full fields, for the admin panel "my
profile" case) and a public byline-only read are two different shapes of the same action, and
`hasPermission` resolves exactly one check per (role, resource, action) — a second, conflicting
shape for the same rule isn't expressible. The public page instead calls `find()` with
`access: { bypass: true }` and projects only `name`/`slug`/`bio`/`avatar` itself (Step 10) — the
documented fallback for a collection that is not fully public (decision 22).

```ts
import { defineAccess } from "@vexcms/core"

import { TABLE_SLUG_USERS, USER_ROLES } from "~/db/constants"
import { articles, categories, images, users } from "~/vexcms/collections"

import { ownOnly, ownOnlyFields, readOwn } from "./permissions"

export const access = defineAccess({
  anonRole: USER_ROLES.user,
  roles: Object.values(USER_ROLES),
  userRolesField: "roles",
  userCollectionSlug: TABLE_SLUG_USERS,
  resources: [images, users, categories, articles],
  permissions: {
    [USER_ROLES.admin]: {
      "*": true,
    },
    [USER_ROLES.editor]: {
      "*": false,
      // TODO 1: adminPanel.access: true
      // TODO 2: images — read: true, create: true, update: true
      // TODO 3: categories: true — full editorial control, no ownership restriction
      // TODO 4: articles: true — full editorial control (create/update/delete/readDrafts/
      //   saveDraft/publish/unpublish/featured), any author's article, no owner restriction
    },
    [USER_ROLES.author]: {
      "*": false,
      // TODO 5: adminPanel.access: true
      // TODO 6: images — read: true, create: true (authors upload their own cover art)
      // TODO 7: categories — read: true (taxonomy is editor-owned; bylines live on the author's own user row)
      // TODO 8: articles.read, articles.readDrafts → readOwn(articles, "author")
      // TODO 9: articles.create: true
      // TODO 10: articles.update, articles.saveDraft →
      //   ownOnlyFields(articles, "author", { "*": true, featured: false })
      //   (own rows only; every field writable except `featured`)
      // TODO 11: articles.publish, articles.unpublish, articles.delete — leave unset
      //   (default-deny: authors draft, only editor/admin publish or delete)
    },
    [USER_ROLES.user]: {
      "*": false,
      // TODO 12: articles.read → published-only (withIndex "by_status" on vex_status, if indexed,
      //   or a plain `{ "*": false, read: ({data}) => data?.vex_status === "published" }` callback)
      // TODO 13: categories.read: true — taxonomy is public; the public author page
      //   (`/authors/[slug]`, Step 10) does NOT read through a widened `users.read` rule — see
      //   this file's "Author↔user link" note above
    },
  },
})
```

#### magazine/src/vexcms/collections/articles.ts

Edit — 2 changes to Step 7's file (anchored by identifier, not line number).

1 — beside the `versions` key, add `hooks`:

```ts
  hooks: {
    beforeChange: deriveArticleFields,
  },
```

2 — append below the `defineCollection` call: the hook (and import it in the field block as a
companion to TODO 2's slug `validate`).

```ts
import { beforeChangeHook, richTextToPlainText, textValidator, VexError } from "@vexcms/core"

import { TABLE_SLUG_ARTICLES } from "~/db/constants"

/**
 * Derives `slug` from `title` on first write and `readingTime` from `body`'s
 * word count — every create/update. `author` needs no denormalization
 * because it already names the owning account directly.
 *
 * @param props.doc - The document about to be written (already Zod-validated).
 * @param props.operation - `"create"` or `"update"`.
 * @param props.ctx - The mutation context.
 * @returns The doc to persist, with `slug`/`readingTime` filled in.
 */
export const deriveArticleFields = beforeChangeHook(TABLE_SLUG_ARTICLES, async ({ doc, operation, ctx }) => {
  // TODO 1: when `operation === "create"` and `doc.slug` is blank, derive a slug from
  //   `doc.title` — lowercase, non-alphanumeric runs collapsed to a single "-", trimmed
  // TODO 2: compute `readingTime` from `doc.body` via
  //   `richTextToPlainText({ document: doc.body ?? [] })`, split on whitespace, word count
  //   divided by 200 wpm, `Math.max(1, Math.ceil(...))`
  // TODO 3: return `{ ...doc, slug, readingTime }`
  throw new Error("Not implemented")
})

/**
 * Server-only uniqueness check for `articles.slug` — called from the field's
 * own `validate` option (TODO 2, `articles.ts`).
 *
 * @param props.value - The slug being saved.
 * @param props.doc - The document being written (`doc._id` excludes its own row).
 * @param props.vex - Read-only VexCMS API for the uniqueness lookup.
 * @throws {VexError} `SLUG_CONFLICT` when another article already uses `value`.
 */
export const validateArticleSlug = textValidator(TABLE_SLUG_ARTICLES, async ({ value, doc, vex }) => {
  // TODO 1: `const [existing] = await vex.find({ collection: TABLE_SLUG_ARTICLES,
  //   withIndex: { name: "by_slug", range: (q) => q.eq("slug", value) }, limit: 1 })`
  // TODO 2: when `existing` exists and `existing._id !== doc._id`, throw
  //   `new VexError({ code: "SLUG_CONFLICT", message: \`"${value}" is already in use by another article.\` })`
  // TODO 3: otherwise return — the value is unique
  throw new Error("Not implemented")
})
```

#### magazine/src/vexcms/admin/CopyPublicLinkAction.tsx

New file — `edit.header.actions` contribution. Guided stub: component signature + JSDoc + TODO.

```tsx
import { useVexDocument } from "@vexcms/react/admin"

/**
 * `edit.header.actions` contribution: copies the open document's public URL
 * to the clipboard. Renders for `articles`/`categories`, and for a `user` document that has a
 * byline `slug` set — the collections/rows with a public route.
 *
 * @returns A header button, or nothing for a brand-new unsaved document (no
 *   public URL exists yet).
 */
export function CopyPublicLinkAction() {
  const document = useVexDocument()
  // TODO 1: resolve the public path from `document.slug` (the collection
  //   slug) and `document.saved?.slug` (the document's own slug) —
  //   "articles" → `/articles/${slug}`, "user" → `/authors/${slug}` (only when the row has a
  //   byline slug), "categories" → `/categories/${slug}`
  // TODO 2: render nothing when `document.saved?.slug` is absent
  // TODO 3: render a header button (icon: Link2) whose onClick copies
  //   `${NEXT_PUBLIC_SITE_URL}${path}` via `navigator.clipboard.writeText`
  //   and shows a toast confirming the copy
  throw new Error("Not implemented")
}
```

#### magazine/src/vex.config.ts

1 edit — add the slot contribution to the root `admin` block.

```ts
import { CopyPublicLinkAction } from "~/vexcms/admin/CopyPublicLinkAction"

  admin: {
    sidebar: { side: "right" },
    components: {
      edit: {
        header: {
          actions: [{ id: "magazine.copyPublicLink", component: CopyPublicLinkAction }],
        },
      },
    },
  },
```

#### magazine/convex/auth/options.ts

1 edit — production sign-up lockdown (decision 21): the scaffold's `{{OAUTH_PROVIDERS}}`
placeholder already resolved to `emailAndPassword: { enabled: true },` (email/password was
chosen at Step 6's scaffold prompt); add `disableSignUp`, read from a Convex env var Step 11
flips to `"true"` only after the developer's own first prod sign-up and `demo:accounts` have
both run.

```ts
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.AUTH_DISABLE_SIGN_UP === "true",
  },
```

Verify: run-through rows "author cannot edit another author's article", "author cannot publish",
"featured is editor-only", "duplicate slug rejected server-side", "Copy link header action",
"byline fields live on the user row" pass; `AUTH_DISABLE_SIGN_UP` unset locally leaves sign-up
enabled (`disableSignUp` defaults `false`); tag `magazine/03-access`

### Step 9 — Magazine 04: seed, reset, demo accounts [agent] — needs developer exception

Why: every take starts from the same content and the same five accounts.

- [ ] `magazine/convex/seed.ts` (`init`, `reinit`, `reset`)
- [ ] `magazine/convex/demoAccounts.ts` (`setRoles`)
- [ ] `magazine/scripts/create-demo-accounts.mjs`
- [ ] `magazine/package.json` — `seed:reinit`, `seed:reset`, `demo:accounts` scripts
- [ ] `magazine/.env.example` — `DEMO_*` names (no values)
- [ ] `pnpm seed`; `pnpm seed:reinit`; `pnpm seed:reset`; `pnpm demo:accounts`
- [ ] `git tag magazine/04-seed && git push origin magazine/04-seed`

#### magazine/convex/seed.ts

Mirrors `apps/www/convex/seed.ts`'s `runSeed(ctx, mode)` shape (Design Decision 9): documents are
located by natural key (slug) and either left alone (`"insert"`) or patched in place
(`"patch"`). `reset` additionally deletes any `categories`/`articles` row whose slug is not in
this file — never touches `user`/`session`/`account` beyond patching the three demo authors'
byline fields (`slug`/`bio`), which `reset`'s deletion pass never reaches (decision 22 — ownership
= user, so byline data lives on rows this file never deletes).

3 author bylines, each patched onto a `demo:accounts` user row by email (decision 22 — no separate
`authors` collection, so every byline needs a signed-in account first): Mina Oduya and Theo
Castellanos each have published work; Priya Natarajan has none yet — demonstrates an author page
with zero articles, not a missing login. 4 categories. 8 logical articles (9 rows: article 4
carries an unpublished revision as a second, linked draft row; article 5 is draft-only, never
published).

```ts
import type { WithoutSystemFields } from "convex/server"
import type { RichTextDocument } from "@vexcms/core"

import {
  TABLE_SLUG_ARTICLES,
  TABLE_SLUG_CATEGORIES,
  TABLE_SLUG_USERS,
} from "~/db/constants"

import type { Doc, Id } from "./_generated/dataModel"

import { internalMutation, type MutationCtx } from "./_generated/server"

type SeedMode = "insert" | "patch"

export interface SeedReport {
  created: string[]
  patched: string[]
  skipped: string[]
}

const CATEGORIES = [
  { slug: "technology", title: "Technology", description: "Software, hardware, and the people who make them." },
  { slug: "culture", title: "Culture", description: "What we watch, read, and argue about." },
  { slug: "business", title: "Business", description: "Work, money, and the shape of the economy." },
  { slug: "science", title: "Science", description: "Research, space, and the natural world." },
] as const

const AUTHOR_BYLINES = [
  {
    slug: "mina-oduya",
    bio: "Mina covers technology and culture. She has been writing for the magazine since 2019.",
    emailEnv: "DEMO_AUTHOR_A_EMAIL",
  },
  {
    slug: "theo-castellanos",
    bio: "Theo writes about business and science, with a focus on independent research labs.",
    emailEnv: "DEMO_AUTHOR_B_EMAIL",
  },
  {
    slug: "priya-natarajan",
    bio: "Priya is a contributing photographer and occasional essayist, newly on staff.",
    emailEnv: "DEMO_AUTHOR_C_EMAIL",
  },
] as const

function p(text: string): RichTextDocument[number] {
  return { type: "p", children: [{ text }] }
}
function h2(text: string): RichTextDocument[number] {
  return { type: "h2", children: [{ text }] }
}
function blockquote(text: string): RichTextDocument[number] {
  return { type: "blockquote", children: [{ text }] }
}

interface ArticleSeed {
  slug: string
  title: string
  excerpt: string
  body: RichTextDocument
  authorSlug: (typeof AUTHOR_BYLINES)[number]["slug"]
  categorySlug: (typeof CATEGORIES)[number]["slug"]
  featured: boolean
  readingTime: number
  publishedAt?: number
  status: "published" | "draft-only" | "published-with-draft"
  revision?: { title: string; excerpt: string; body: RichTextDocument }
}

const DAY_MS = 86_400_000
const NOW = Date.UTC(2026, 10, 1)

const ARTICLES: ArticleSeed[] = [
  {
    slug: "the-fold-is-dead-long-live-the-fold",
    title: "The Fold Is Dead, Long Live the Fold",
    excerpt: "Readers still stop scrolling. They just stop somewhere the grid never expected.",
    body: [
      h2("The Fold Is Dead, Long Live the Fold"),
      p("Readers still stop scrolling. They just stop somewhere the grid never expected."),
      p("A decade of 'the fold is dead' coverage missed the part that actually changed: attention didn't flatten, it fragmented into a dozen smaller folds, one per device."),
    ],
    authorSlug: "mina-oduya",
    categorySlug: "technology",
    featured: true,
    readingTime: 4,
    publishedAt: NOW - 2 * DAY_MS,
    status: "published",
  },
  {
    slug: "why-your-inbox-hates-you",
    title: "Why Your Inbox Hates You",
    excerpt: "An inbox is a to-do list someone else wrote for you.",
    body: [
      p("An inbox is a to-do list someone else wrote for you, sorted by whoever hit send last."),
      p("The fix isn't a better filter. It's deciding, once, which of these actually need a reply today."),
    ],
    authorSlug: "mina-oduya",
    categorySlug: "technology",
    featured: false,
    readingTime: 3,
    publishedAt: NOW - 5 * DAY_MS,
    status: "published",
  },
  {
    slug: "the-four-day-week-three-years-in",
    title: "The Four-Day Week, Three Years In",
    excerpt: "The pilot programs ended. The four-day week mostly didn't.",
    body: [
      p("The pilot programs ended two years ago. The four-day week, for the companies that tried it, mostly didn't."),
      blockquote("We stopped measuring hours and started measuring whether the work got done."),
      p("That's the line every founder we talked to repeated, almost verbatim."),
    ],
    authorSlug: "mina-oduya",
    categorySlug: "business",
    featured: false,
    readingTime: 6,
    publishedAt: NOW - 9 * DAY_MS,
    status: "published",
  },
  {
    slug: "dispatch-from-a-flooded-archive",
    title: "Dispatch From a Flooded Archive",
    excerpt: "A regional newspaper's basement archive, and what six feet of water took with it.",
    body: [
      h2("Dispatch From a Flooded Archive"),
      p("A regional newspaper's basement archive held forty years of uncatalogued negatives. Six feet of water took most of them."),
      p("What's left is being digitized by volunteers, two boxes a week."),
    ],
    authorSlug: "mina-oduya",
    categorySlug: "culture",
    featured: true,
    readingTime: 5,
    publishedAt: NOW - 12 * DAY_MS,
    status: "published-with-draft",
    revision: {
      title: "Dispatch From a Flooded Archive (updated)",
      excerpt: "A regional newspaper's basement archive, and what six feet of water took with it — updated with photos from the volunteer effort.",
      body: [
        h2("Dispatch From a Flooded Archive"),
        p("A regional newspaper's basement archive held forty years of uncatalogued negatives. Six feet of water took most of them."),
        p("What's left is being digitized by volunteers, two boxes a week. This update adds photos from that effort, taken on-site last month."),
      ],
    },
  },
  {
    slug: "notes-on-being-terminally-online",
    title: "Notes on Being Terminally Online",
    excerpt: "A personal essay, still in progress.",
    body: [
      p("A personal essay, still in progress — this draft has never been published."),
      p("Posting it here anyway, because the point was never to finish it quietly."),
    ],
    authorSlug: "mina-oduya",
    categorySlug: "culture",
    featured: false,
    readingTime: 7,
    status: "draft-only",
  },
  {
    slug: "the-quiet-rise-of-backyard-observatories",
    title: "The Quiet Rise of Backyard Observatories",
    excerpt: "Consumer telescopes got good enough that a backyard is now an observatory.",
    body: [
      p("Consumer telescopes got good enough, and cheap enough, that a suburban backyard is now a functioning observatory."),
      p("Amateur astronomers are finding things professional surveys miss, simply by pointing a $2,000 scope at the sky every clear night."),
    ],
    authorSlug: "theo-castellanos",
    categorySlug: "science",
    featured: false,
    readingTime: 5,
    publishedAt: NOW - 3 * DAY_MS,
    status: "published",
  },
  {
    slug: "what-a-decade-of-minimalism-actually-cost-me",
    title: "What a Decade of Minimalism Actually Cost Me",
    excerpt: "Owning less turned out to have its own price tag.",
    body: [
      p("Owning less turned out to have its own price tag: replacing things more often, buying higher-quality versions of everything, moving more often to chase smaller spaces."),
      p("None of that shows up in the before-and-after photos."),
    ],
    authorSlug: "theo-castellanos",
    categorySlug: "culture",
    featured: false,
    readingTime: 4,
    publishedAt: NOW - 7 * DAY_MS,
    status: "published",
  },
  {
    slug: "small-press-big-numbers",
    title: "Small Press, Big Numbers",
    excerpt: "Independent publishers are outselling some imprints three times their size.",
    body: [
      p("Independent publishers are outselling some imprints three times their size, on a fraction of the marketing budget."),
      blockquote("We just publish fewer books and mean every one of them."),
    ],
    authorSlug: "theo-castellanos",
    categorySlug: "business",
    featured: false,
    readingTime: 5,
    publishedAt: NOW - 14 * DAY_MS,
    status: "published",
  },
]

async function upsertBySlug<T extends string>(props: {
  ctx: MutationCtx
  table: T
  slug: string
  mode: SeedMode
  data: Record<string, unknown>
  created: string[]
  patched: string[]
  skipped: string[]
  label: string
}): Promise<Id<T>> {
  const { ctx, table, slug, mode, data, created, patched, skipped, label } = props
  const existing = await ctx.db
    .query(table)
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .first()
  if (!existing) {
    const id = await ctx.db.insert(table, data as WithoutSystemFields<Doc<T>>)
    created.push(label)
    return id
  }
  if (mode === "patch") {
    await ctx.db.patch(existing._id, data)
    patched.push(label)
  } else {
    skipped.push(label)
  }
  return existing._id
}

async function runSeed(ctx: MutationCtx, mode: SeedMode): Promise<SeedReport> {
  const created: string[] = []
  const patched: string[] = []
  const skipped: string[] = []

  const categoryIds = new Map<string, Id<typeof TABLE_SLUG_CATEGORIES>>()
  for (const category of CATEGORIES) {
    const id = await upsertBySlug({
      ctx,
      table: TABLE_SLUG_CATEGORIES,
      slug: category.slug,
      mode,
      data: { title: category.title, slug: category.slug, description: category.description },
      created,
      patched,
      skipped,
      label: `category:${category.slug}`,
    })
    categoryIds.set(category.slug, id)
  }

  const authorUserIds = new Map<string, Id<typeof TABLE_SLUG_USERS>>()
  for (const author of AUTHOR_BYLINES) {
    const email = process.env[author.emailEnv]
    const userDoc = email
      ? await ctx.db
          .query(TABLE_SLUG_USERS)
          .withIndex("by_email", (q) => q.eq("email", email))
          .first()
      : null
    if (!userDoc) {
      skipped.push(`author-byline:${author.slug} (no ${author.emailEnv} account yet — run demo:accounts first)`)
      continue
    }
    authorUserIds.set(author.slug, userDoc._id)
    const needsByline = userDoc.slug === undefined || userDoc.bio === undefined
    if (mode === "patch" || needsByline) {
      await ctx.db.patch(userDoc._id, { slug: author.slug, bio: author.bio })
      patched.push(`author-byline:${author.slug}`)
    } else {
      skipped.push(`author-byline:${author.slug}`)
    }
  }

  for (const article of ARTICLES) {
    const authorId = authorUserIds.get(article.authorSlug)
    const categoryId = categoryIds.get(article.categorySlug)
    if (!authorId) {
      skipped.push(`article:${article.slug} (author account missing — run demo:accounts first)`)
      continue
    }
    const baseFields = {
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      body: article.body,
      author: [authorId],
      categories: categoryId ? [categoryId] : undefined,
      publishedAt: article.publishedAt,
      featured: article.featured,
      readingTime: article.readingTime,
    }

    if (article.status === "draft-only") {
      const existingRows = await ctx.db
        .query(TABLE_SLUG_ARTICLES)
        .withIndex("by_slug", (q) => q.eq("slug", article.slug))
        .collect()
      const existing = existingRows[0]
      if (!existing) {
        await ctx.db.insert(TABLE_SLUG_ARTICLES, { ...baseFields, vex_status: "draft" } as never)
        created.push(`article:${article.slug} (draft-only)`)
      } else if (mode === "patch") {
        await ctx.db.patch(existing._id, baseFields)
        patched.push(`article:${article.slug} (draft-only)`)
      } else {
        skipped.push(`article:${article.slug} (draft-only)`)
      }
      continue
    }

    const existingRows = await ctx.db
      .query(TABLE_SLUG_ARTICLES)
      .withIndex("by_slug", (q) => q.eq("slug", article.slug))
      .collect()
    const publishedRow = existingRows.find((row) => row.vex_status !== "draft")
    const draftRow = existingRows.find((row) => row.vex_status === "draft")

    let publishedId: Id<typeof TABLE_SLUG_ARTICLES>
    if (!publishedRow) {
      publishedId = await ctx.db.insert(TABLE_SLUG_ARTICLES, { ...baseFields, vex_status: "published" } as never)
      created.push(`article:${article.slug}`)
    } else if (mode === "patch") {
      await ctx.db.patch(publishedRow._id, { ...baseFields, vex_status: "published" })
      patched.push(`article:${article.slug}`)
      publishedId = publishedRow._id
    } else {
      skipped.push(`article:${article.slug}`)
      publishedId = publishedRow._id
    }

    if (article.status === "published-with-draft" && article.revision) {
      const revisionFields = {
        ...baseFields,
        title: article.revision.title,
        excerpt: article.revision.excerpt,
        body: article.revision.body,
        vex_status: "draft" as const,
        vex_publishedId: publishedId,
      }
      if (!draftRow) {
        await ctx.db.insert(TABLE_SLUG_ARTICLES, revisionFields as never)
        created.push(`article:${article.slug} (unpublished revision)`)
      } else if (mode === "patch") {
        await ctx.db.patch(draftRow._id, revisionFields)
        patched.push(`article:${article.slug} (unpublished revision)`)
      } else {
        skipped.push(`article:${article.slug} (unpublished revision)`)
      }
    }
  }

  return { created, patched, skipped }
}

export const init = internalMutation({
  args: {},
  handler: async (ctx) => runSeed(ctx, "insert"),
})

export const reinit = internalMutation({
  args: {},
  handler: async (ctx) => runSeed(ctx, "patch"),
})

export const reset = internalMutation({
  args: {},
  handler: async (ctx) => {
    const report = await runSeed(ctx, "patch")
    const removed: string[] = []
    const seededSlugs: Array<[typeof TABLE_SLUG_ARTICLES | typeof TABLE_SLUG_CATEGORIES, Set<string>]> = [
      [TABLE_SLUG_ARTICLES, new Set(ARTICLES.map((a) => a.slug))],
      [TABLE_SLUG_CATEGORIES, new Set(CATEGORIES.map((c) => c.slug))],
    ]
    for (const [table, slugs] of seededSlugs) {
      const rows = await ctx.db.query(table).collect()
      for (const row of rows) {
        const slug = (row as { slug?: string }).slug
        if (slug !== undefined && !slugs.has(slug)) {
          await ctx.db.delete(row._id)
          removed.push(`${table}:${slug}`)
        }
      }
    }
    return { ...report, removed }
  },
})
```

#### magazine/convex/demoAccounts.ts

```ts
import { v } from "convex/values"

import { TABLE_SLUG_USERS } from "~/db/constants"

import { internalMutation } from "./_generated/server"

/**
 * Patches a demo account's `roles`, by email. Called once per account from
 * `scripts/create-demo-accounts.mjs`, right after that account's Better
 * Auth sign-up — `roles` is `input: false`, so sign-up itself can never set
 * it; this is the only path that does. Internal only: never reachable from
 * the client, so it carries no RBAC check of its own.
 *
 * @param args.email - The account's email, exactly as signed up.
 * @param args.roles - The full `roles` array to store (replaces, not merges).
 * @throws When no `user` row matches `email`.
 */
export const setRoles = internalMutation({
  args: {
    email: v.string(),
    roles: v.array(v.string()),
  },
  handler: async (ctx, { email, roles }) => {
    const user = await ctx.db
      .query(TABLE_SLUG_USERS)
      .withIndex("by_email", (q) => q.eq("email", email))
      .first()
    if (!user) {
      throw new Error(`No user found for ${email}`)
    }
    await ctx.db.patch(user._id, { roles })
  },
})
```

#### magazine/scripts/create-demo-accounts.mjs

```js
#!/usr/bin/env node
/**
 * Creates the magazine's five demo accounts (admin, editor, three authors)
 * and grants each the right `roles`, exactly once per deployment.
 *
 * Posts a real Better Auth email sign-up to the running app's own
 * `/api/auth/sign-up/email` route, then calls the `demoAccounts:setRoles`
 * internal mutation over the Convex CLI to patch each account's `roles` in
 * place. A 422 (Better Auth's `USER_ALREADY_EXISTS`) is treated as
 * idempotent — the account already exists, roles still get (re)patched.
 *
 * Run: `pnpm demo:accounts` (dev) or
 * `SITE_URL=<prod url> node --env-file=.env.local scripts/create-demo-accounts.mjs --prod`
 */

const PROD = process.argv.includes("--prod")
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3200"

const ACCOUNTS = [
  { name: "Demo Admin", roles: ["user", "admin"], emailEnv: "DEMO_ADMIN_EMAIL", passwordEnv: "DEMO_ADMIN_PASSWORD" },
  { name: "Demo Editor", roles: ["user", "editor"], emailEnv: "DEMO_EDITOR_EMAIL", passwordEnv: "DEMO_EDITOR_PASSWORD" },
  { name: "Mina Oduya", roles: ["user", "author"], emailEnv: "DEMO_AUTHOR_A_EMAIL", passwordEnv: "DEMO_AUTHOR_A_PASSWORD" },
  { name: "Theo Castellanos", roles: ["user", "author"], emailEnv: "DEMO_AUTHOR_B_EMAIL", passwordEnv: "DEMO_AUTHOR_B_PASSWORD" },
  { name: "Priya Natarajan", roles: ["user", "author"], emailEnv: "DEMO_AUTHOR_C_EMAIL", passwordEnv: "DEMO_AUTHOR_C_PASSWORD" },
]

async function signUp(account) {
  const email = process.env[account.emailEnv]
  const password = process.env[account.passwordEnv]
  if (!email || !password) {
    throw new Error(`Missing ${account.emailEnv}/${account.passwordEnv} in .env.local`)
  }
  const response = await fetch(`${SITE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, name: account.name }),
  })
  if (!response.ok && response.status !== 422) {
    throw new Error(`Sign-up for ${email} failed: ${response.status} ${await response.text()}`)
  }
  return email
}

async function setRoles(email, roles) {
  const { execFileSync } = await import("node:child_process")
  const args = ["convex", "run", "demoAccounts:setRoles", JSON.stringify({ email, roles })]
  if (PROD) args.push("--prod")
  execFileSync("npx", args, { stdio: "inherit" })
}

async function main() {
  for (const account of ACCOUNTS) {
    const email = await signUp(account)
    await setRoles(email, account.roles)
    console.log(`\u2713 ${account.name} <${email}> \u2014 roles: ${account.roles.join(", ")}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
```

#### magazine/package.json

1 edit — add three scripts beside the existing `seed`:

```json
"seed:reinit": "convex run seed:reinit",
"seed:reset": "convex run seed:reset",
"demo:accounts": "node --env-file=.env.local scripts/create-demo-accounts.mjs"
```

#### magazine/.env.example

New file — names only, no values (real values live in gitignored `.env.local`):

```
DEMO_ADMIN_EMAIL=
DEMO_ADMIN_PASSWORD=
DEMO_EDITOR_EMAIL=
DEMO_EDITOR_PASSWORD=
DEMO_AUTHOR_A_EMAIL=
DEMO_AUTHOR_A_PASSWORD=
DEMO_AUTHOR_B_EMAIL=
DEMO_AUTHOR_B_PASSWORD=
DEMO_AUTHOR_C_EMAIL=
DEMO_AUTHOR_C_PASSWORD=
```

Run `demo:accounts` before `seed`/`seed:reinit` — `articles.author` is a required relationship
straight to the signed-in account (decision 22), so an article whose author's demo account doesn't
exist yet is skipped entirely, not inserted with an empty link. Run `seed:reinit` again after
`demo:accounts` to backfill any bylines or articles that were skipped.

Verify: `pnpm demo:accounts` creates five accounts (admin, editor, three authors) with the right
roles; `pnpm seed` run after `demo:accounts` creates the seeded documents and patches byline
fields onto the three author rows; `pnpm seed:reinit` restores an edited article and byline;
`pnpm seed:reset` removes a demo-created article and restores the start state; tag
`magazine/04-seed`

### Step 10 — Magazine 05: front end, live preview, richtext render [agent] — needs developer exception

Why: the D2 story — edit an article, the real route updates before save; an unpublished draft
previews through Draft Mode.

Mirrors the marketing-site template's `pages`/`[slug]` route, `PageContent.tsx`'s live-preview
query swap, and its Draft Mode fallback (`draftMode().isEnabled` → `getBySlugPreview`) — the
same Contract `apps/www`'s `/posts/[slug]` route follows for a single, non-slug-driven-index
collection. Files copied/adapted: `app/api/vex/revalidate/route.ts` and
`app/api/vex/live-preview/route.ts` (near-verbatim, `pages` → magazine's 3 collections'
`routes.map`), `app/sitemap.ts`/`app/robots.ts` (verbatim pattern, swapped query), the
`[slug]/page.tsx` Draft Mode branch (adapted from `apps/www`'s `/posts/[slug]`, since articles —
like posts — are a single flat collection, not a CMS-pages tree).

- [ ] `magazine/src/lib/vex.ts` (new)
- [ ] `magazine/src/lib/metadata.ts` (new)
- [ ] `magazine/src/vex.config.ts` — `routes.map`
- [ ] `magazine/convex/articles.ts`, `magazine/convex/authors.ts`, `magazine/convex/categories.ts` (new)
- [ ] `magazine/src/app/sitemap.ts`, `magazine/src/app/robots.ts` (new)
- [ ] `magazine/src/app/api/vex/revalidate/route.ts`, `magazine/src/app/api/vex/live-preview/route.ts` (new)
- [ ] `magazine/src/components/MediaImage.tsx` (new)
- [ ] `magazine/src/app/(frontend)/(site)/layout.tsx` (new)
- [ ] `magazine/src/app/(frontend)/(site)/page.tsx` + `HomeContent.tsx` (new)
- [ ] `magazine/src/app/(frontend)/(site)/articles/[slug]/page.tsx` + `ArticleContent.tsx` (new)
- [ ] `magazine/src/app/(frontend)/(site)/authors/[slug]/page.tsx` + `AuthorContent.tsx` (new)
- [ ] `magazine/src/app/(frontend)/(site)/categories/[slug]/page.tsx` + `CategoryContent.tsx` (new)
- [ ] `pnpm build`
- [ ] `git tag magazine/05-front-end && git push origin magazine/05-front-end`

#### magazine/src/lib/vex.ts

```ts
import { createVexServerClient } from "@vexcms/next/cache"

import { env } from "~/env.mjs"

export const vex = createVexServerClient({ url: env.NEXT_PUBLIC_CONVEX_URL })
```

#### magazine/convex/articles.ts

```ts
import { DRAFT_ACTIONS } from "@vexcms/core"
import { v } from "convex/values"

import { TABLE_SLUG_ARTICLES } from "~/db/constants"
import { find, publishedSlugs as readPublishedSlugs } from "~/vexcms/api"

import { query } from "./_generated/server"

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    find({
      ctx,
      collection: TABLE_SLUG_ARTICLES,
      withIndex: { name: "by_slug", range: (q) => q.eq("slug", slug) },
      limit: 1,
      access: { bypass: true },
    }),
})

export const getBySlugPreview = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const matches = await find({
      ctx,
      collection: TABLE_SLUG_ARTICLES,
      withIndex: { name: "by_slug", range: (q) => q.eq("slug", slug) },
      drafts: true,
      access: { action: DRAFT_ACTIONS.readDrafts },
    })
    const draft = matches.find((doc) => doc.vex_status === "draft")
    return draft ? [draft] : matches.filter((doc) => doc.vex_status === "published")
  },
})

export const publishedSlugs = query({
  args: {},
  handler: async (ctx) =>
    readPublishedSlugs({ access: { bypass: true }, collection: TABLE_SLUG_ARTICLES, ctx }),
})

export const listPublished = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) =>
    find({
      ctx,
      collection: TABLE_SLUG_ARTICLES,
      limit: limit ?? 20,
      access: { bypass: true },
    }),
})
```

#### magazine/convex/authors.ts

```ts
import { v } from "convex/values"

import { TABLE_SLUG_ARTICLES, TABLE_SLUG_USERS } from "~/db/constants"
import { find } from "~/vexcms/api"

import { query } from "./_generated/server"

/**
 * Public byline projection — never the full `user` row (the
 * template's own-row-by-email `read` check and a public byline-only read
 * are two different shapes of the same action, and access control resolves
 * exactly one shape per role/resource/action, so this query enforces the
 * projection itself with `access.bypass` instead of widening the rule).
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const [user] = await find({
      ctx,
      collection: TABLE_SLUG_USERS,
      withIndex: { name: "by_slug", range: (q) => q.eq("slug", slug) },
      limit: 1,
      access: { bypass: true },
    })
    if (!user) return []
    return [{ _id: user._id, avatar: user.avatar, bio: user.bio, name: user.name, slug: user.slug }]
  },
})

export const listArticlesByAuthor = query({
  args: { authorId: v.string() },
  handler: async (ctx, { authorId }) =>
    find({
      ctx,
      collection: TABLE_SLUG_ARTICLES,
      withIndex: { name: "by_author", range: (q) => q.eq("author", [authorId]) },
      access: { bypass: true },
    }),
})
```

#### magazine/convex/categories.ts

```ts
import { v } from "convex/values"

import { TABLE_SLUG_ARTICLES, TABLE_SLUG_CATEGORIES } from "~/db/constants"
import { find } from "~/vexcms/api"

import { query } from "./_generated/server"

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    find({
      ctx,
      collection: TABLE_SLUG_CATEGORIES,
      withIndex: { name: "by_slug", range: (q) => q.eq("slug", slug) },
      limit: 1,
      access: { bypass: true },
    }),
})

export const listArticlesByCategory = query({
  args: { categoryId: v.string() },
  handler: async (ctx, { categoryId }) =>
    find({
      ctx,
      collection: TABLE_SLUG_ARTICLES,
      withIndex: { name: "by_categories", range: (q) => q.eq("categories", [categoryId]) },
      access: { bypass: true },
    }),
})
```

#### magazine/src/vex.config.ts

1 edit — add `routes.map`, beside `collections`/`mediaCollections`:

```ts
  routes: {
    map: ({ collection, doc }) => {
      if (collection !== articles.slug) return []
      const { slug } = doc
      return typeof slug === "string" ? [`/articles/${slug}`] : []
    },
  },
```

#### magazine/src/app/sitemap.ts

```ts
import { api } from "@convex/_generated/api"
import { createVexSitemap } from "@vexcms/next/seo"

import { env } from "~/env.mjs"
import { vex } from "~/lib/vex"

export default createVexSitemap({
  client: vex,
  query: api.articles.publishedSlugs,
  toUrl: (slug) => `${env.NEXT_PUBLIC_SITE_URL}/articles/${slug}`,
  getSlug: (item) => item.slug,
})
```

#### magazine/src/app/robots.ts

```ts
import { createVexRobots } from "@vexcms/next/seo"

import { env } from "~/env.mjs"

export default createVexRobots({
  siteUrl: env.NEXT_PUBLIC_SITE_URL,
  disallow: ["/admin", "/api"],
})
```

#### magazine/src/app/api/vex/revalidate/route.ts

```ts
import { api } from "@convex/_generated/api"
import { createVexRevalidateRoute } from "@vexcms/next/cache"

import { getToken, getUserOrg } from "~/auth/server"
import { vex } from "~/lib/vex"
import config from "~/vex.config.server"

export const { POST } = createVexRevalidateRoute({
  config,
  getToken,
  getAuth: getUserOrg,
  listCollection: async (collection) => {
    if (collection !== "articles") return []
    const entries = await vex.query(api.articles.publishedSlugs, {})
    return entries.map(({ slug }) => ({ slug }))
  },
})
```

#### magazine/src/app/api/vex/live-preview/route.ts

```ts
import { createVexDraftModeRoute } from "@vexcms/next/livePreview"

import { getToken } from "~/auth/server"

export const { GET } = createVexDraftModeRoute({ getToken })
```

#### magazine/src/components/MediaImage.tsx

```tsx
"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"

/**
 * Renders an `upload()` field value as a `next/image`, resolving the stored
 * media id to a public URL through the storage adapter first.
 *
 * @param props.value - Raw `upload()` field value.
 * @param props.alt - Accessible name. Omit to read the media document's own `alt`.
 * @param props.width - Intrinsic width hint for `next/image`.
 * @param props.height - Intrinsic height hint for `next/image`.
 * @param props.sizes - `next/image` `sizes`, required for a viewport-tracking width.
 * @param props.className - Classes applied to the rendered image.
 */
export function MediaImage({
  alt,
  className,
  height,
  sizes,
  value,
  width,
}: {
  alt?: string
  className?: string
  height: number
  sizes?: string
  value: string | string[] | undefined
  width: number
}) {
  const mediaId = Array.isArray(value) ? value[0] : value
  const needsAlt = alt === undefined && Boolean(mediaId)

  const { data } = useQuery({
    ...convexQuery(api.vex.media.getUrl, mediaId ? { adapter: "convex", mediaId } : "skip"),
    enabled: Boolean(mediaId),
  })
  const { data: doc, isPending: altPending } = useQuery({
    ...convexQuery(api.images.getById, needsAlt && mediaId ? { id: mediaId } : "skip"),
    enabled: needsAlt,
  })

  const url = (data as undefined | { url?: string })?.url
  if (!url) return null
  if (needsAlt && altPending) return null

  const resolvedAlt = alt ?? (doc as undefined | { alt?: string })?.alt ?? ""
  return <Image alt={resolvedAlt} className={className} height={height} sizes={sizes} src={url} width={width} />
}
```

#### magazine/src/lib/metadata.ts

```ts
import type { Metadata } from "next"

import { api } from "@convex/_generated/api"

import { env } from "~/env.mjs"
import { vex } from "~/lib/vex"

const TITLE_SUFFIX = " | The Magazine"

export async function generateArticleMetadata(props: { slug: string }): Promise<Metadata> {
  const [article] = await vex.query(api.articles.getBySlug, { slug: props.slug })
  if (!article) return { title: `Not found${TITLE_SUFFIX}` }
  return {
    title: `${article.title}${TITLE_SUFFIX}`,
    description: article.excerpt,
    alternates: { canonical: `${env.NEXT_PUBLIC_SITE_URL}/articles/${article.slug}` },
  }
}
```

#### magazine/src/app/(frontend)/(site)/layout.tsx

```tsx
import type { ReactNode } from "react"

import Link from "next/link"

export default function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <a className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-100 focus-visible:rounded-sm focus-visible:border focus-visible:bg-card focus-visible:px-3 focus-visible:py-2" href="#main">
        Skip to content
      </a>
      <header className="border-b px-6 py-4">
        <Link className="text-lg font-semibold" href="/">
          The Magazine
        </Link>
      </header>
      <main id="main">{children}</main>
    </>
  )
}
```

#### magazine/src/app/(frontend)/(site)/page.tsx

```tsx
import { api } from "@convex/_generated/api"

import { vex } from "~/lib/vex"

import { HomeContent } from "./HomeContent"

export const revalidate = 3600

export default async function HomePage() {
  let initialData: Awaited<ReturnType<typeof vex.query<typeof api.articles.listPublished>>> = []
  try {
    initialData = await vex.query(api.articles.listPublished, { limit: 20 })
  } catch {
    initialData = []
  }
  return <HomeContent initialData={initialData} />
}
```

#### magazine/src/app/(frontend)/(site)/HomeContent.tsx

```tsx
"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

import type { Article } from "~/vex.types"

export function HomeContent({ initialData }: { initialData: Article[] }) {
  const { data: articles } = useQuery({
    ...convexQuery(api.articles.listPublished, { limit: 20 }),
    initialData,
  })
  const featured = articles.filter((a) => a.featured)
  const rest = articles.filter((a) => !a.featured)

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {featured.length > 0 && (
        <section className="mb-12">
          <h1 className="mb-4 text-2xl font-semibold">Featured</h1>
          <ul className="space-y-4">
            {featured.map((article) => (
              <li key={article._id}>
                <Link className="text-xl font-medium hover:underline" href={`/articles/${article.slug}`}>
                  {article.title}
                </Link>
                <p className="text-muted-foreground">{article.excerpt}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Latest</h2>
        <ul className="space-y-4">
          {rest.map((article) => (
            <li key={article._id}>
              <Link className="font-medium hover:underline" href={`/articles/${article.slug}`}>
                {article.title}
              </Link>
              <p className="text-muted-foreground">{article.excerpt}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
```

#### magazine/src/app/(frontend)/(site)/articles/[slug]/page.tsx

Draft Mode branch mirrors `apps/www`'s `/posts/[slug]` — articles are a flat, slug-addressed
collection like `posts`, not a CMS-pages tree like the marketing template's `pages`.

```tsx
import { api } from "@convex/_generated/api"
import { fetchQuery } from "convex/nextjs"
import { draftMode } from "next/headers"
import { notFound } from "next/navigation"

import { getToken } from "~/auth/server"
import { generateArticleMetadata } from "~/lib/metadata"
import { vex } from "~/lib/vex"

import { ArticleContent } from "./ArticleContent"

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generateArticleMetadata({ slug })
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const draft = await draftMode()
  if (draft.isEnabled) {
    const token = await getToken()
    const initialData = await fetchQuery(api.articles.getBySlugPreview, { slug }, token ? { token } : undefined)
    return (
      <>
        <meta content="1" name="vex-session" />
        <ArticleContent draftMode initialData={initialData} slug={slug} />
      </>
    )
  }

  const initialData = await vex.query(api.articles.getBySlug, { slug })
  if (initialData.length === 0) notFound()

  return <ArticleContent initialData={initialData} slug={slug} />
}
```

#### magazine/src/app/(frontend)/(site)/articles/[slug]/ArticleContent.tsx

```tsx
"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { keepPreviousData } from "@tanstack/react-query"
import { useLivePreviewQuery } from "@vexcms/react"
import { RichText } from "@vexcms/richtext-plate/render"

import type { Article } from "~/vex.types"

import { MediaImage } from "~/components/MediaImage"
import { useSitePreviewMode } from "~/lib/useSitePreviewMode"

export function ArticleContent({
  draftMode,
  initialData,
  slug,
}: {
  draftMode?: boolean
  initialData: Article[]
  slug: string
}) {
  const previewModeActive = useSitePreviewMode() || Boolean(draftMode)
  const { data: article } = useLivePreviewQuery(
    {
      ...convexQuery(previewModeActive ? api.articles.getBySlugPreview : api.articles.getBySlug, { slug }),
      initialData,
      placeholderData: keepPreviousData,
    },
    "articles",
  )

  if (!article) return <p className="mx-auto max-w-3xl px-6 py-16">Article not found.</p>

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {article.cover && article.cover.length > 0 && (
        <MediaImage className="mb-8 aspect-video w-full rounded-lg object-cover" height={720} sizes="(min-width: 768px) 768px, 100vw" value={article.cover} width={1280} />
      )}
      <h1 className="text-4xl font-semibold tracking-tight">{article.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{article.readingTime} min read</p>
      <RichText className="prose mt-8" content={article.body ?? []} />
    </div>
  )
}
```

`src/lib/useSitePreviewMode.ts` is copied verbatim from the marketing-site template (no project
logic in it — reads the live-preview cookie/query param on mount).

#### magazine/src/app/(frontend)/(site)/authors/[slug]/page.tsx

```tsx
import { api } from "@convex/_generated/api"
import { notFound } from "next/navigation"

import { vex } from "~/lib/vex"

import { AuthorContent } from "./AuthorContent"

export const revalidate = 3600

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [author] = await vex.query(api.authors.getBySlug, { slug })
  if (!author) notFound()
  const articles = await vex.query(api.authors.listArticlesByAuthor, { authorId: author._id })
  return <AuthorContent articles={articles} author={author} />
}
```

#### magazine/src/app/(frontend)/(site)/authors/[slug]/AuthorContent.tsx

```tsx
import Link from "next/link"

import type { Article } from "~/vex.types"

import { MediaImage } from "~/components/MediaImage"

interface AuthorProfile {
  _id: string
  avatar?: string[]
  bio?: string
  name: string
  slug?: string
}

export function AuthorContent({ articles, author }: { articles: Article[]; author: AuthorProfile }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {author.avatar && author.avatar.length > 0 && (
        <MediaImage className="mb-4 size-20 rounded-full object-cover" height={80} value={author.avatar} width={80} />
      )}
      <h1 className="text-3xl font-semibold">{author.name}</h1>
      <p className="mt-2 text-muted-foreground">{author.bio}</p>
      <ul className="mt-8 space-y-4">
        {articles.map((article) => (
          <li key={article._id}>
            <Link className="font-medium hover:underline" href={`/articles/${article.slug}`}>
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

#### magazine/src/app/(frontend)/(site)/categories/[slug]/page.tsx

```tsx
import { api } from "@convex/_generated/api"
import { notFound } from "next/navigation"

import { vex } from "~/lib/vex"

import { CategoryContent } from "./CategoryContent"

export const revalidate = 3600

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [category] = await vex.query(api.categories.getBySlug, { slug })
  if (!category) notFound()
  const articles = await vex.query(api.categories.listArticlesByCategory, { categoryId: category._id })
  return <CategoryContent articles={articles} category={category} />
}
```

#### magazine/src/app/(frontend)/(site)/categories/[slug]/CategoryContent.tsx

```tsx
import Link from "next/link"

import type { Article, Category } from "~/vex.types"

export function CategoryContent({ articles, category }: { articles: Article[]; category: Category }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">{category.title}</h1>
      <p className="mt-2 text-muted-foreground">{category.description}</p>
      <ul className="mt-8 space-y-4">
        {articles.map((article) => (
          <li key={article._id}>
            <Link className="font-medium hover:underline" href={`/articles/${article.slug}`}>
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

Verify: `pnpm build` 0 with `/`, `/articles/[slug]` prerendered; run-through rows "live preview
updates without reload", "draft-only article previews", "sitemap lists published only",
"revalidate on publish" pass; tag `magazine/05-front-end`

### Step 11 — Magazine 06: Convex prod + Vercel production [agent] — needs developer exception

Why: the D5 story ends on a live production URL (decision 6 — production stays up after launch,
unlike the torn-down dev-only setups elsewhere). This step also proves the deployment guide by
following it, verifies decision 15's `vex deploy --cmd` flag passthrough actually ran, and runs decision 21's
sign-up lockdown.

Waits for: human — magazine Convex prod + Vercel project + env set up.

- [ ] Human prerequisites confirmed: Convex prod deployment `vex-example-magazine` linked with
      `SITE_URL`/`BETTER_AUTH_SECRET` set; Vercel project `vexcms-example-magazine` with Build
      Command `pnpm vex:deploy --cmd 'pnpm build'`, `CONVEX_DEPLOY_KEY`/
      `NEXT_PUBLIC_CONVEX_SITE_URL`/`NEXT_PUBLIC_SITE_URL`/`BETTER_AUTH_SECRET` set for
      Production, a production deploy run at least once, and the developer's own sign-up at the
      prod URL (became admin)
- [ ] Production build log checked: the Vercel build ran `vex deploy --cmd` (decision 15) — schema
      and functions pushed, then `pnpm build` ran exactly once, on the final push
- [ ] Prod URL verified: `200`, the 8 seeded articles visible, `/admin` sign-in works as the
      developer's own account
- [ ] `pnpm demo:accounts` run against the prod URL (editor + three authors created with roles)
- [ ] Sign-up lockdown sequence run (decision 21): `npx convex env set AUTH_DISABLE_SIGN_UP true
      --prod`; verified `POST /api/auth/sign-up/email` now errors and a demo account can still
      sign in
- [ ] Live URLs written into `magazine/README.md` ("Live demo" line: site URL, `/admin`)
- [ ] Any deviation from `apps/docs/src/content/docs/guides/deployment.mdx` fixed in the
      monorepo (not `magazine/`) in this same step
- [ ] `git tag magazine/06-deployed && git push origin magazine/06-deployed`

No agent-run `vercel link`/`env add`/`deploy` (decision 6 — the developer owns every Convex-prod,
Vercel project, and production env step; the section below is confirmed, never run, by this
step).

**Human prerequisites, confirmed not run**

```markdown
- Convex prod deployment `vex-example-magazine` exists; `SITE_URL`/`BETTER_AUTH_SECRET` set via
  `npx convex env set --prod`.
- Vercel project `vexcms-example-magazine` linked; Build Command overridden to
  `pnpm vex:deploy --cmd 'pnpm build'` (decision 15 — `vex deploy` now forwards `--cmd` straight to
  `convex deploy`, which injects `NEXT_PUBLIC_CONVEX_URL` into the build itself; it no longer
  needs setting by hand).
- Vercel Production env vars: `CONVEX_DEPLOY_KEY`, `NEXT_PUBLIC_CONVEX_SITE_URL`,
  `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_SECRET`.
- A production deploy has run at least once.
- The developer signed up at the prod URL first — first sign-up is auto-promoted to admin, same
  bootstrap path as dev.
```

**Checking the build log (decision 15)**

```bash
vercel inspect https://vexcms-example-magazine.vercel.app --logs
```

Confirm the log shows one `convex deploy --cmd 'pnpm build'` run: schema/functions pushed, then
`pnpm build` executed exactly once, after the push. decision 15's CLI fix strips `--cmd`/
`--cmd-url-env-var-name` from every auto-migration interim push, so the build only ever runs on
the final deploy — `pnpm build` appearing more than once, or running before the schema push,
means the fix isn't landing correctly; escalate, don't patch around it here.

**Verifying the deployment**

```bash
curl -I https://vexcms-example-magazine.vercel.app/
```

`200`; sign in at `https://vexcms-example-magazine.vercel.app/admin` as the developer's own
account (created in the human prerequisites); confirm the 8 seeded articles are visible.

**Sign-up lockdown sequence (decision 21)**

```bash
cd ~/Documents/Projects/vexcms-examples/magazine
SITE_URL=https://vexcms-example-magazine.vercel.app node --env-file=.env.local scripts/create-demo-accounts.mjs --prod
npx convex env set AUTH_DISABLE_SIGN_UP true --prod
```

Verify row:

```bash
curl -i -X POST https://vexcms-example-magazine.vercel.app/api/auth/sign-up/email \
  -H "content-type: application/json" \
  -d '{"email":"nobody@example.com","password":"wontwork123","name":"Nobody"}'
```

Returns an error status (`EMAIL_PASSWORD_SIGN_UP_DISABLED`, Step 8's `options.ts` edit). Sign in
with `DEMO_ADMIN_EMAIL`/`DEMO_ADMIN_PASSWORD` at `/admin` — still works: lockdown only closes
`/sign-up/email`, not `/sign-in/email`.

#### magazine/README.md

1 edit — add a "Live demo" section after the intro paragraph, before "## Getting Started"
(decision 6):

```markdown
## Live demo

https://vexcms-example-magazine.vercel.app/ — [admin](https://vexcms-example-magazine.vercel.app/admin)
```

Any place the real `guides/deployment.mdx` content diverges from the commands above — a
different flag, a missing env var, an extra manual step — is fixed directly in
`apps/docs/src/content/docs/guides/deployment.mdx` in this same step, monorepo-relative, not
`magazine/`.

Verify: Vercel build log shows a single `vex deploy --cmd` run (functions pushed, `pnpm build`
once); `https://vexcms-example-magazine.vercel.app/` 200 with the 8 seeded articles; `/admin`
sign-in works; prod sign-up returns an error status after lockdown, demo sign-in still works;
`magazine/README.md` has the Live demo line; every deviation from `guides/deployment.mdx` fixed
in the monorepo; tag `magazine/06-deployed`

### Step 12 — Magazine playbook + run-through [agent] — needs developer exception

Why: the scripts must be rehearsable as written; a beat that can't be run is a false claim.

- [ ] `.agent/docs/specs/2026-11-09-golden-use-cases/playbooks/magazine.md`
- [ ] `.agent/docs/specs/2026-11-09-golden-use-cases/golden-runthrough.md` § magazine

#### .agent/docs/specs/2026-11-09-golden-use-cases/playbooks/magazine.md

````markdown
# Magazine — playbook

Private. Beats only — no spoken sentences (Design Decision 11); the developer speaks in their own
words.

## Stage tags

`magazine/01-scaffold`, `02-collections`, `03-access`, `04-seed`, `05-front-end`, `06-deployed`.

## Accounts

| Role | Env | Name |
|---|---|---|
| Admin | `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD` | Demo Admin |
| Editor | `DEMO_EDITOR_EMAIL` / `DEMO_EDITOR_PASSWORD` | Demo Editor |
| Author A | `DEMO_AUTHOR_A_EMAIL` / `DEMO_AUTHOR_A_PASSWORD` | Mina Oduya (5 articles) |
| Author B | `DEMO_AUTHOR_B_EMAIL` / `DEMO_AUTHOR_B_PASSWORD` | Theo Castellanos (3 articles) |
| Author C | `DEMO_AUTHOR_C_EMAIL` / `DEMO_AUTHOR_C_PASSWORD` | Priya Natarajan (0 articles) |

## Seed data

- 4 categories: Technology, Culture, Business, Science.
- 3 author bylines, each a signed-in account (decision 22 — ownership = user, no separate
  `authors` collection): Mina Oduya (author A), Theo Castellanos (author B), Priya Natarajan
  (author C, 0 articles — demonstrates an author page with no published work yet).
- 8 articles: "The Fold Is Dead, Long Live the Fold" (featured), "Why Your Inbox Hates You", "The
  Four-Day Week, Three Years In", "Dispatch From a Flooded Archive" (featured, has an unpublished
  revision), "Notes on Being Terminally Online" (draft-only), "The Quiet Rise of Backyard
  Observatories", "What a Decade of Minimalism Actually Cost Me", "Small Press, Big Numbers".

## Launch day

D2–D5 (Design Decision 3 — magazine covers all four launch days).

## Start state + reset

Start from `magazine/05-front-end` with `pnpm seed:reinit` run. Between scripts: `pnpm seed:reset`
removes any take-created article and restores every seeded document to the file's content.

## 5-minute script

Starts from `05-front-end` with seeded data; one live change.

| # | Budget | Start (tag) | On screen | Proves (F-id + doc link) | Gap callout |
|---|---|---|---|---|---|
| 1 | 30s | 05-front-end | `:3200/admin` articles list, 8 seeded articles | F1, F2, F52 — https://docs.vexcms.dev/guides/quickstart/ | |
| 2 | 40s | 05-front-end | Open "The Fold Is Dead…" edit view, live-preview pane open on `/articles/the-fold-is-dead-long-live-the-fold` | F33 — https://docs.vexcms.dev/guides/live-preview/; F19 — https://docs.vexcms.dev/fields/richtext/ | No visitor comment form on the public article page — form builder for visitor submissions isn't shipped yet (#57) |
| 3 | 60s | (same) | Edit the excerpt live; preview updates with no save | F4, F7, F8, F11, F13 — https://docs.vexcms.dev/fields/text/, /fields/date/, /fields/textarea/, /fields/relationship/ | |
| 4 | 40s | (same) | Save as draft, don't publish | F31 — https://docs.vexcms.dev/guides/versioning-and-drafts/ | |
| 5 | 50s | (same) | Sign in as author B in a second session; "Mina's" draft is not visible in author B's article list | F39 — https://docs.vexcms.dev/guides/access-control/ | |
| 6 | 40s | (same) | As editor, publish the edited article; public `/articles/<slug>` updates | F49, F50 — https://docs.vexcms.dev/guides/local-api/, /guides/caching-and-seo/ | Articles publish immediately — no scheduled publish-at time yet (#63) |
| 7 | 40s | (same) | Open "Notes on Being Terminally Online" (draft-only) via its live-preview Draft Mode link | F35 — https://docs.vexcms.dev/guides/live-preview/ | |

## 15-minute script

Scaffolds live, jumps across tags, ends on the deploy beat shown from Step 11's run-through
transcript — never a live production deploy.

| # | Budget | Start (tag) | On screen | Proves (F-id + doc link) | Gap callout |
|---|---|---|---|---|---|
| 1 | 90s | (live scaffold) | `pnpm create vexcms@alpha magazine-demo --bare`; sign up; land in `/admin` as auto-promoted admin | F55 — https://docs.vexcms.dev/guides/quickstart/; F37 — https://docs.vexcms.dev/guides/auth/ | |
| 2 | 90s | 02-collections | `src/vexcms/collections/articles.ts` in the editor; `pnpm vex:dev` regenerating `vex.schema.ts`/`vex.types.ts` | F1, F2, F52 — https://docs.vexcms.dev/guides/quickstart/ | |
| 3 | 120s | (same) | Add `subtitle: text()` to `articles.ts` live; save; the field appears in the admin form and in `Article`'s generated type | F1, F2 (config → schema → types loop) | One locale only — no per-article translations yet (#59) |
| 4 | 150s | 03-access | `src/auth/access.ts` matrix; author cannot open another author's article; attempt a duplicate slug, show the server-rejected `VexError`; toggle `featured` as author (disabled) then as editor (works) | F39, F40, F43, F45 — https://docs.vexcms.dev/guides/access-control/, /guides/lifecycle-hooks/ | |
| 5 | 150s | 04-seed/05-front-end | Edit a published article twice, save each time, open History, restore the first version | F31, F32 — https://docs.vexcms.dev/guides/versioning-and-drafts/ | |
| 6 | 60s | (same) | Draft-only article's public URL signed out (404) vs. signed in with live preview (renders) | F35 — https://docs.vexcms.dev/guides/live-preview/ | |
| 7 | 90s | (narrated from Step 11's transcript) | Vercel build log showing `vex deploy --cmd` running; `demo:accounts --prod`; `convex env set AUTH_DISABLE_SIGN_UP true --prod`; the live URL in `magazine/README.md` | F53 — https://docs.vexcms.dev/guides/deployment/ | |

## Shot list

| File | ≤ 60 s | Shows | From | Day |
|---|---|---|---|---|
| `real-time-admin-and-live-preview.mp4` | yes | Article edit view with live-preview pane open; edit a field; preview updates with no reload | `:3200/admin`, an existing article edit view; preview iframe on `/articles/<slug>` | D2 |
| `one-config-schema-and-types.mp4` | yes | `articles.ts`'s `defineCollection`; `pnpm vex:dev` regenerating in a terminal; the generated `Article` type; the admin form rendering the new field | editor on `magazine/src/vexcms/collections/articles.ts`, a terminal, `:3200/admin` | D3 |
| `access-control-hooks-validation.mp4` | yes | `access.ts` matrix for `articles`; an author attempting another author's edit, denied; a duplicate slug rejected server-side | editor on `magazine/src/auth/access.ts`, `:3200/admin` under two sessions | D4 |
| `create-vexcms-to-deployed.mp4` | yes | `pnpm create vexcms@alpha magazine …` scaffolding end to end; the scaffolded site open in a browser | terminal in a scratch directory, the scaffold's own dev server | D5 |
````

#### .agent/docs/specs/2026-11-09-golden-use-cases/golden-runthrough.md

New section (file created by this step if it does not yet exist, mirroring
`launch-infrastructure/n-runthrough.md`'s shape):

````markdown
# Golden use cases — run-through

## magazine

Run against `create-vexcms@0.1.0-alpha.35` / `@vexcms/*@0.1.0-alpha.35`, scaffolded at
`~/Documents/Projects/vexcms-examples/magazine`, port 3200, Convex project `vex-example-magazine`.

| | magazine |
|---|---|
| Folder | `~/Documents/Projects/vexcms-examples/magazine` |
| Answers | `magazine`, Next.js, port 3200, email/password yes, orgs no, no OAuth, git no, install yes; `--bare` |
| Convex project | `vex-example-magazine` |
| Vercel project | `vexcms-example-magazine` |
| Env | `.env.local` `BETTER_AUTH_SECRET` generated by the scaffold; `SITE_URL`/`BETTER_AUTH_SECRET` set on the dev deployment; prod equivalents set in Step 11 |

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Precondition: every `@vexcms/*` tag reads alpha.35 | `npm view @vexcms/<pkg> dist-tags.alpha` × 8 | every line `0.1.0-alpha.35` | pending |
| Scaffold | `pnpm create vexcms@alpha magazine --bare` | install/lint/format succeed | pending |
| Exact-pin package.json | inspect `package.json` | every `@vexcms/*` pinned, no `~` | pending |
| `vex dev` generates | `pnpm vex:dev` | `vex.schema.ts`/`vex.types.ts` present | pending |
| First sign-up is admin | sign up at `:3200` | `/admin`, `roles` includes `admin` | pending |
| `--bare` seed gap confirmed | `pnpm seed` before Step 9 | fails (no `convex/seed.ts` yet) — recorded, not fixed | pending |
| `pnpm typecheck` (Step 7) | `pnpm typecheck` | 0 | pending |
| Admin shows the extended collections | `:3200/admin` | Categories, Articles, and `Users` with byline fields (slug/bio/avatar) | pending |
| Drafts + autosave + live preview on articles | edit an article | autosave fires, preview pane works | pending |
| Author cannot edit another author's article | sign in as author A, open author B's article | denied | pending |
| Author cannot publish | author role, articles edit view | Publish absent/disabled | pending |
| `featured` is editor-only | author edits own article | `featured` read-only; editor can toggle | pending |
| Duplicate slug rejected server-side | create two articles with the same slug | second create throws `VexError` | pending |
| Copy public link header action | open any article/category edit view, or a `user` document with a byline slug set | header button copies the public URL | pending |
| Author byline page never exposes email | inspect the `/authors/mina-oduya` query response | only `_id`/`name`/`slug`/`bio`/`avatar`, no `email`/`roles` | pending |
| `pnpm demo:accounts` then `pnpm seed` | `pnpm demo:accounts && pnpm seed` | seeded documents created; byline fields patched onto the three author accounts | pending |
| `pnpm seed:reinit` | edit an article in admin, then `pnpm seed:reinit` | edit reverted to file content | pending |
| `pnpm seed:reset` | create a demo article, then `pnpm seed:reset` | demo article removed, start state restored | pending |
| `pnpm demo:accounts` | `pnpm demo:accounts` | admin/editor/author A/author B/author C created with correct roles | pending |
| `pnpm build` | `pnpm build` | 0; `/`, `/articles/[slug]` prerendered | pending |
| Live preview updates without reload | edit a field in an open preview | public route updates, no refresh | pending |
| Draft-only article previews | open the draft-only article's Draft Mode link | renders for the signed-in editor | pending |
| Sitemap lists published only | `curl :3200/sitemap.xml` | 8 published-equivalent entries, no draft-only slug | pending |
| Revalidate on publish | publish an edited article | `/articles/<slug>` reflects the edit immediately | pending |
| Production build log ran `vex deploy --cmd` | `vercel inspect <prod-url> --logs` | functions pushed once, `pnpm build` ran exactly once, on the final push | pending |
| Prod URL 200 | `curl -I https://vexcms-example-magazine.vercel.app/` | 200, 8 seeded articles | pending |
| Prod admin sign-in | sign in at the prod URL `/admin` as the developer's own account | works | pending |
| Prod sign-up lockdown | `pnpm demo:accounts --prod`; `convex env set AUTH_DISABLE_SIGN_UP true --prod`; `POST /api/auth/sign-up/email` | sign-up returns an error status; a demo account can still sign in | pending |
| `magazine/README.md` live demo line | inspect `magazine/README.md` | "Live demo" section lists the site URL and `/admin` | pending |
| Deployment guide followed | Step 11 transcript | every command matches `guides/deployment.mdx`; deviations fixed in the guide | pending |
| 5-minute script, every beat | run `playbooks/magazine.md` § 5-minute | every beat executes as written | pending |
| 15-minute script, every beat | run `playbooks/magazine.md` § 15-minute | every beat executes as written | pending |
| Shot list, every clip | record the 4 clips per `playbooks/magazine.md` § Shot list | each ≤ 60s, matches its "Shows" cell | pending |
| Examples CI green | push to `vexcms/examples` | `ci` workflow green on `magazine/` | pending |
````

Verify: `golden-runthrough.md` § magazine has every 5-min and 15-min beat and every shot executed
`pass`; `seed:reset` between scripts restores the start state; examples CI green

### Step 13 — `media-session.md` rewrite + D5 fact-sheet link [agent]

Why: the launch clips, demo take and PH hero come from scenario 1; LK owns the file, so GU takes
the § Locks row.

Waits for: GU-12. LK-8 waits for this row.

- [ ] `.agent/docs/specs/2026-11-06-launch-kit-final-review/media-session.md`
- [ ] `.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md` — D5 fact-sheet line

#### .agent/docs/specs/2026-11-06-launch-kit-final-review/media-session.md

Numbered edits against the current file (read fully before editing — this spec's own Design
Decision 13 is binding: the four clips, demo take/GIF, and PH gallery hero move to the magazine
on :3200; `/tour` and the brand admin/mobile/live-preview screenshots stay on `apps/www`).

1 — intro blockquote: add a line naming the source split.

```markdown
> One recording session for every frozen image of the UI that ships at launch (cross-spec
> decision 7): this spec's step 8 (4 feature clips), public-presence step 16 (demo MP4, hero GIF,
> 4 fixed-size screenshots) and launch-infrastructure step 10's `/tour` recapture (4 PNGs).
> Developer-run (board row LK-8). Sources: this spec's step 8, public-presence spec step 16,
> launch-infrastructure spec step 10. The 4 feature clips, the demo take/GIF and the Product
> Hunt gallery hero are captured on the magazine example (`golden-use-cases` spec, scenario 1,
> `:3200`) per that spec's Design Decision 13; `/tour` and the brand admin/mobile/live-preview
> screenshots stay on `apps/www` (`:3030`), because `/tour`'s captions describe the www admin.
> Nothing here is post copy: the clips are silent and the posts that describe them are the
> developer's own text (Design Decision 11).
```

2 — `## Preconditions`: replace the `apps/www` dev-server/reseed lines with the two-server split
(www for `/tour` + brand screenshots, magazine for everything else).

```markdown
## Preconditions

- [ ] Board: QP-6 (admin views) and QP-7 (www pages) are `done`. Recording earlier ships pre-fix screens.
- [ ] Your `apps/www` dev server is running on `:3030` against the Convex dev deployment (P-024: attach, never start a second one).
- [ ] Re-seed the `apps/www` dev deployment: `pnpm --filter www exec convex run seed:reinit`.
- [ ] Your magazine dev servers are running on `:3200` (`~/Documents/Projects/vexcms-examples/magazine`, P-024: attach, never start a second one).
- [ ] Reset the magazine dev deployment to its seeded start state: `pnpm seed:reset`, then `pnpm demo:accounts`.
- [ ] Browser: a clean profile (no extensions, bookmarks bar hidden), 100% zoom, light theme unless a shot says otherwise. Hide desktop notifications.
- [ ] Two signed-in magazine sessions ready for the RBAC clip: an author and an editor (`DEMO_AUTHOR_A_EMAIL`/`DEMO_EDITOR_EMAIL`, two browser profiles or one normal + one private window).
- [ ] An empty scratch directory for the scaffold takes (`create-vexcms-to-deployed`, the demo take, both now a `magazine`-named scaffold). Its dev server is the fresh scaffold's own first run, not `apps/www`/`apps/test`/the tagged `magazine/` clone.
```

3 — `## Order`: www-sourced shots first, then the switch to magazine.

```markdown
## Order (fewest setup switches)

1. `/tour` screenshots (`apps/www` admin only, no recording).
2. Public-presence fixed-size screenshots: admin, live preview, mobile (`apps/www`).
3. Switch to the magazine dev servers (`:3200`): confirm `seed:reset` + `demo:accounts` ran, sign in as author and editor.
4. Public-presence Product Hunt gallery hero screenshot (magazine).
5. Clip `real-time-admin-and-live-preview` (magazine, D2).
6. Clip `access-control-hooks-validation` (magazine, D4).
7. Clip `one-config-schema-and-types` (magazine, D3 — editor + terminal + admin).
8. Scaffold takes: clip `create-vexcms-to-deployed`, then the public-presence demo take (scaffold → publish), both a fresh `magazine`-named scaffold on :3200.
```

4 — `### Public-presence step 16 — screenshots`: add a `From` column; only the PH hero row's
source changes (admin/live-preview/mobile stay `apps/www`, unchanged).

```markdown
### Public-presence step 16 — screenshots

| File (`apps/www/public/brand/`) | Size | Shows | From |
|---|---|---|---|
| `screenshot-admin-1280x800.png` | 1280×800 | The admin panel | `apps/www` `:3030/admin` |
| `screenshot-live-preview-1280x800.png` | 1280×800 | Edit view + live preview side by side | `apps/www` `:3030/admin` |
| `screenshot-admin-mobile-390x844.png` | 390×844 | The admin on a phone (devtools responsive mode or a real device) | `apps/www` `:3030/admin` |
| `screenshot-producthunt-1270x760.png` | 1270×760 | A polished hero-style shot of the magazine's published front end, not a raw admin screen (PH gallery, `sources.md` §2.3) | magazine `:3200/` |
```

5 — `### Public-presence step 16 — demo take`: scaffold a fresh `magazine`-named project instead
of `demo-site`, same 7 beats.

```markdown
### Public-presence step 16 — demo take (30–60 s MP4 + looping GIF)

One continuous take, scaffold to publish, on the magazine example:

1. Terminal, empty directory: `pnpm create vexcms@alpha magazine --bare` (the scenario's own scaffold command).
2. Open the app; sign up; land in `/admin` as the auto-promoted admin.
3. Add one field to `articles.ts` in `vex.config.ts`; save; `vex dev`'s watcher regenerates the schema.
4. In the admin, create an article, fill the new field, open live preview side by side.
5. Edit the field; the preview updates without a reload.
6. Publish; the public page renders it.
7. Cut to the published article as an anonymous visitor.
```

6 — `### This spec's 4 clips`: same filenames, `From` cells point at magazine `:3200`.

```markdown
### This spec's 4 clips — silent H.264 MP4, ≤ 60 s, ≤ 10 MB (`apps/www/public/launch/`)

| File | Shows | From |
|---|---|---|
| `real-time-admin-and-live-preview.mp4` | A document open in the admin with the live-preview pane open; edit a field; the preview updates with no manual refresh | magazine `:3200/admin`, an existing article edit view; preview iframe on `/articles/<slug>` |
| `one-config-schema-and-types.mp4` | A collection's `defineCollection` call in the editor; `pnpm vex:dev` in a terminal; the generated `Article` type; the admin form rendering the same fields | editor on `magazine/src/vexcms/collections/articles.ts`, a terminal, magazine `:3200/admin` |
| `access-control-hooks-validation.mp4` | The `access.ts` matrix for `articles`; a restricted role (author) attempting a write and getting the server-enforced rejection; an editor doing the same write successfully | editor on `magazine/src/auth/access.ts`, magazine `:3200/admin` under two sessions |
| `create-vexcms-to-deployed.mp4` | `pnpm create vexcms@alpha magazine …` scaffolding end to end in a terminal, then the scaffolded site open in a browser | terminal in the scratch directory, the scaffold's own dev server |
```

`## Encode`, `## Place`, and `## Checks` are unchanged — every file still lands in
`apps/www/public/launch/`/`apps/www/public/brand/`/`apps/www/public/tour/` and serves from
`:3030`, so the destination paths and curl checks stay exactly as written regardless of which
dev server recorded the source footage.

#### .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md

1 edit — D5 fact sheet `Docs:` line gains the deployment guide, same "and" pattern D4's line
already uses:

```markdown
Docs: https://docs.vexcms.dev/guides/quickstart/ and
https://docs.vexcms.dev/guides/deployment/
```

Verify: every clip row's "From" cell names a magazine route or command on `:3200`; `/tour` and
brand-screenshot rows (admin/live-preview/mobile) unchanged; `launch-kit.md` D5 "Docs:" line
carries `https://docs.vexcms.dev/guides/deployment/`; lock released

### Step 14 — Real estate 01–02: scaffold, collections, fields [dev] — needs developer exception

Why: the broadest field-system scenario: tabs, rows, conditional sale/rent fields, masks, galleries.
Waits for: GU-12 (mirrors magazine's patterns).
Verify: `pnpm typecheck` 0; admin renders the listing form's tabs and switches fields on `listingType`; tags `real-estate/01-scaffold`, `real-estate/02-collections`

- [ ] `pnpm create vexcms@alpha real-estate --bare`, port 3210, Convex project `vex-example-real-estate`
- [ ] `npx convex dev` once; paste the printed `NEXT_PUBLIC_CONVEX_URL`/`NEXT_PUBLIC_CONVEX_SITE_URL` into `.env.local`; `npx convex env set SITE_URL http://localhost:3210`; `npx convex env set BETTER_AUTH_SECRET <value>`; `pnpm vex:dev` + `pnpm dev`; first sign-up becomes admin
- [ ] `real-estate/src/db/constants/index.ts`
- [ ] `real-estate/src/vexcms/collections/agents.ts`
- [ ] `real-estate/src/vexcms/collections/listings.ts`
- [ ] `real-estate/src/vexcms/collections/index.ts`
- [ ] `real-estate/src/vex.config.ts`
- [ ] tag `real-estate/01-scaffold` after the scaffold + first sign-up, tag `real-estate/02-collections` once `pnpm typecheck` is clean with both collections registered

#### real-estate/src/db/constants/index.ts

One edit. Everything not shown is unchanged — the file already exports `TABLE_SLUG_USERS`, `TABLE_SLUG_IMAGES`, and re-exports `./auth`.

**1 — new table slugs and enum consts, added after the existing `TABLE_SLUG_IMAGES` line.**

```ts
export const TABLE_SLUG_AGENTS = "agents" as const
export type AgentDoc = Doc<typeof TABLE_SLUG_AGENTS>
export type AgentID = Id<typeof TABLE_SLUG_AGENTS>

export const TABLE_SLUG_LISTINGS = "listings" as const
export type ListingDoc = Doc<typeof TABLE_SLUG_LISTINGS>
export type ListingID = Id<typeof TABLE_SLUG_LISTINGS>

export const LISTING_TYPES = {
  sale: "sale",
  rent: "rent",
} as const
export type ListingType = (typeof LISTING_TYPES)[keyof typeof LISTING_TYPES]

export const LISTING_STATUSES = {
  active: "active",
  pending: "pending",
  sold: "sold",
} as const
export type ListingStatus = (typeof LISTING_STATUSES)[keyof typeof LISTING_STATUSES]
```

#### real-estate/src/vexcms/collections/agents.ts

New file. Guided stub — the developer fills in `fields` on camera. The roster profile for a listing agent: public bio/contact card plus the link to the Better Auth account that signs them in and owns their assigned listings (`listings.agentId` / `listings.agentUserId`, wired in Step 15).

```ts
import { defineCollection } from "@vexcms/core"

import { TABLE_SLUG_AGENTS } from "~/db/constants"

/**
 * Agent roster — one public profile per listing agent.
 *
 * TODO: fields, in order
 * 1. name — text({ required: true, label: "Name" })
 * 2. slug — text({ required: true, index: "by_slug", label: "Slug", description: "Public /agents/[slug] path" })
 * 3. email — email({ required: true, index: "by_email", label: "Email" }) — the index is how
 *    `demoAccounts.ts` matches a freshly signed-up account back to this profile
 * 4. phone — text({ label: "Phone", admin: { mask: "(999) 999-9999" } })
 * 5. photo — upload({ to: TABLE_SLUG_IMAGES, label: "Photo" })
 * 6. user — relationship({ collection: { slug: TABLE_SLUG_USERS }, label: "Linked Account" }) —
 *    NOT required: a roster profile can exist before (or without) a login; `demoAccounts.ts`
 *    patches this in after the matching account signs up
 * 7. activeListingCount — number({ label: "Active Listings", defaultValue: 0, admin: { readOnly: true, position: "sidebar" } }) —
 *    kept in sync by the `listings` `afterChange` hook, never hand-edited
 */
export const agents = defineCollection({
  slug: TABLE_SLUG_AGENTS,
  interfaceName: "Agent",
  labels: {
    singular: "Agent",
    plural: "Agents",
  },
  admin: {
    useAsTitle: "name",
    icon: "UserCheck",
  },
  fields: {},
})
```

#### real-estate/src/vexcms/collections/listings.ts

New file. Guided stub. Step 14 covers the field system end to end — `admin.view`/`admin.views`/`admin.components`/`hooks` are added by a Step 15 edit to this same file.

```ts
import { defineCollection } from "@vexcms/core"

import { TABLE_SLUG_AGENTS, TABLE_SLUG_IMAGES, TABLE_SLUG_LISTINGS, TABLE_SLUG_USERS } from "~/db/constants"

/**
 * A for-sale or for-rent listing. The admin form is three tabs: unnamed
 * "Details" and "Media" tabs hoist their fields to the top level; the named
 * "Pricing" tab nests its row of three fields under one `pricing` group
 * (`tabs()`'s named-tab rule — see the tabs field guide).
 *
 * TODO: fields, in order
 * 1. info — tabs({ label: "Listing Info", tabs: [...] })
 *    a. Tab "Details" (unnamed, defaultOpen: true):
 *       - title — text({ required: true, label: "Title", searchIndex: { name: "search_listings_title", filterFields: [] } })
 *       - slug — text({ required: true, index: "by_slug", label: "Slug", description: "Public /listings/[slug] path" })
 *       - listingType — select({ required: true, index: "by_listing_type", label: "Listing Type",
 *         options: [{ label: "For Sale", value: "sale" }, { label: "For Rent", value: "rent" }] })
 *       - description — textarea({ label: "Description", rows: 6 })
 *       - contactEmail — email({ label: "Contact Email" })
 *       - openHousesSection — collapsible({ label: "Open Houses", admin: { defaultCollapsed: true },
 *         fields: { openHouses: array({ label: "Open Houses", items: group({ label: "Open House",
 *           fields: { date: date({ required: true, label: "Date" }), notes: textarea({ label: "Notes" }) } }) }) } })
 *    b. Tab "Pricing" (name: "pricing" — nests as a `pricing` group):
 *       - pricingRow — row({ fields: {
 *           price: number({ label: "Price", admin: { mask: { mask: "decimal", options: { radixPoint: "." } },
 *             condition: ({ data }) => Array.isArray(data.listingType) && data.listingType.includes("sale") } }),
 *           monthlyRent: number({ label: "Monthly Rent", admin: { mask: { mask: "decimal", options: { radixPoint: "." } },
 *             condition: ({ data }) => Array.isArray(data.listingType) && data.listingType.includes("rent") } }),
 *           deposit: number({ label: "Security Deposit", admin: {
 *             condition: ({ data }) => Array.isArray(data.listingType) && data.listingType.includes("rent") } }),
 *         } })
 *    c. Tab "Media" (unnamed):
 *       - virtualTourUrl — url({ label: "Virtual Tour URL" })
 *       - gallery — upload({ to: TABLE_SLUG_IMAGES, label: "Gallery", hasMany: true, accept: "image/*", max: 20 })
 * 2. mlsId — text({ required: true, index: "by_mls_id", label: "MLS ID",
 *    searchIndex: { name: "search_listings_mls_id", filterFields: [] }, validate: mlsIdUniqueValidator })
 *    (`~/vexcms/hooks/listings`)
 * 3. status — select({ required: true, index: "by_status", label: "Status",
 *    options: [{ label: "Active", value: "active" }, { label: "Pending", value: "pending" }, { label: "Sold", value: "sold" }] })
 * 4. commission — number({ label: "Commission %", admin: { position: "sidebar" } }) — NOT `admin.hidden`:
 *    broker/admin must still see it, so the hide-from-agent rule has to be a field map in
 *    `src/auth/access.ts`, not a static admin flag
 * 5. agentId — relationship({ collection: { slug: TABLE_SLUG_AGENTS }, required: true, label: "Listing Agent" })
 * 6. agentUserId — relationship({ collection: { slug: TABLE_SLUG_USERS }, label: "Owning Account",
 *    admin: { hidden: true } }) — denormalized from `agentId`'s linked `agents.user` by the
 *    `beforeChange` hook, purely so the agent-ownership access rule can range
 *    over a field already equal to the signed-in user's own `_id`
 */
export const listings = defineCollection({
  slug: TABLE_SLUG_LISTINGS,
  interfaceName: "Listing",
  labels: {
    singular: "Listing",
    plural: "Listings",
  },
  admin: {
    useAsTitle: "title",
    icon: "Home",
  },
  fields: {},
})
```

#### real-estate/src/vexcms/collections/index.ts

One edit — append two barrel lines. Everything else (the existing `images`/`users` exports) is unchanged.

```ts
export * from "./agents"
export * from "./listings"
```

#### real-estate/src/vex.config.ts

Two edits. Everything not shown — `access`, `authCollections`, `admin.sidebar`, `storage` — is unchanged.

**1 — import.** Beside the existing `import { images, users } from "~/vexcms/collections"`:

```ts
import { agents, images, listings, users } from "~/vexcms/collections"
```

**2 — `collections`.** Replace `collections: [users]`:

```ts
  collections: [users, agents, listings],
```

**Verify:** `pnpm typecheck` 0; `/admin/collections/agents` and `/admin/collections/listings` list (empty, no data yet); the listing edit form shows three tabs and the Pricing tab's fields switch between the price row and the rent/deposit row as `listingType` changes.

### Step 15 — Real estate 03: access, hooks, list views, bulk action [dev] — needs developer exception

Why: the D4 alternate — agents own listings, commission is broker-only, a shared saved view and a "Mark sold" bulk action.
Verify: run-through rows "agent sees only own listings in 'My listings'", "commission hidden from agent", "MLS id unique", "Mark sold bulk action", "agent cannot run Mark sold on others' listings" pass; tag `real-estate/03-access`

- [ ] `real-estate/src/db/constants/auth.ts`
- [ ] `real-estate/convex/auth/schema.ts`
- [ ] `real-estate/src/auth/access.ts`
- [ ] `real-estate/src/vexcms/hooks/listings.ts`
- [ ] `real-estate/src/vexcms/collections/listings.ts`
- [ ] `real-estate/src/vexcms/admin/MarkSoldBulkAction.tsx`
- [ ] `real-estate/convex/listings.ts`
- [ ] `real-estate/convex/auth/options.ts`
- [ ] tag `real-estate/03-access`

#### real-estate/src/db/constants/auth.ts

One edit. Replaces the scaffold's default `admin`/`user` pair — real estate has no public self-service tier, so the lowest real role is `agent`, and `visitor` exists only as the `anonRole` fallback for a session-less caller (never a real login).

```ts
export const USER_ROLES = {
  admin: "admin",
  broker: "broker",
  agent: "agent",
  visitor: "visitor",
} as const
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]
```

#### real-estate/convex/auth/schema.ts

One edit — everything else in the file (model names, `verification`, `plugins`) is unchanged.

```ts
      roles: {
        type: "string[]",
        defaultValue: [USER_ROLES.agent],
        required: true,
        input: false,
      },
```

#### real-estate/convex/auth/options.ts

One edit on the scaffolded file (`packages/create-vexcms/templates/base-nextjs/convex/auth/options.ts`)
— production sign-up lockdown (decision 21): reads a Convex env var the deploy step (Step 17) sets after the
developer's own first sign-up, so Better Auth rejects every subsequent `/api/auth/sign-up/email`
call once the roster is seeded, without touching sign-in. Everything else in `emailAndPassword`
(`enabled: true`, set by the scaffold installer) is unchanged.

```ts
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.AUTH_DISABLE_SIGN_UP === "true",
  },
```

#### real-estate/src/auth/access.ts

Replaces the scaffold's default file in full. Guided stub — the developer builds the permission matrix on camera. `indexedOwnerCheck`/`ownerPredicateCheck` (`@vexcms/core`) are the correct composable owner-check builders: a relationship field always stores `Id[]` regardless of `hasMany`, and these two already compare against `[user._id]` rather than a bare id (confirmed in `packages/core/src/access/buildChecks.ts`'s own `ownerMatches`/`isRelationship` branches) — a hand-written `ix.eq("agentUserId", user._id)` would silently never match.

```ts
import { defineAccess, indexedOwnerCheck, ownerPredicateCheck } from "@vexcms/core"

import { TABLE_SLUG_USERS, USER_ROLES } from "~/db/constants"
import { agents, images, listings, users } from "~/vexcms/collections"

/**
 * Access control for the admin panel and every registered resource.
 *
 * TODO:
 * 1. anonRole: USER_ROLES.visitor — every unauthenticated front-end read (the public
 *    `/listings`, `/listings/[slug]`, `/agents/[slug]` routes, and gallery/photo lookups
 *    through `vex/media:getUrl`) resolves through this role, never `access.bypass`
 * 2. roles: Object.values(USER_ROLES)
 * 3. resources: [agents, listings, images, users]
 * 4. customActions: { listings: { mutation: ["markSold"] } }
 * 5. permissions.admin — { "*": true }
 * 6. permissions.broker — { "*": false, listings: true, agents: true,
 *    images: { "*": false, read: true }, users: { "*": false, read: true } } —
 *    `listings: true`/`agents: true` are the subject-level boolean shorthand: full CRUD
 *    PLUS every view action and the `markSold` custom action, commission included —
 *    brokers see and run everything agents can't
 * 7. permissions.agent — {
 *      "*": false,
 *      listings: {
 *        "*": false,
 *        read: { ...indexedOwnerCheck({ field: "agentUserId", resource: listings }),
 *                filter: () => ({ "*": true, commission: false }) },
 *        update: ({ user, data }) => {
 *          const owner = data?.agentUserId
 *          const owns = Array.isArray(owner) ? owner.includes(user._id) : owner === user._id
 *          if (!owns) return false
 *          return { "*": true, commission: false }
 *        },
 *        markSold: ownerPredicateCheck({ field: "agentUserId", resource: listings }),
 *        readViews: true,
 *        createView: false,
 *        updateView: false,
 *        deleteView: false,
 *      },
 *      agents: { "*": false, read: true },
 *    }
 *    — `read`'s `filter` and `update`'s inline field map both hide `commission`; `markSold`'s
 *    `where`-shaped predicate (via `ownerPredicateCheck`) is what makes the custom action
 *    reject a listing belonging to a different agent, server-side, regardless of what the
 *    bulk-action UI sends
 * 8. permissions.visitor — {
 *      "*": false,
 *      listings: { "*": false, read: () => ({ "*": true, commission: false }) },
 *      agents: { "*": false, read: true },
 *      images: { "*": false, read: true },
 *    }
 */
export const access = defineAccess({
  roles: Object.values(USER_ROLES),
  userRolesField: "roles",
  userCollectionSlug: TABLE_SLUG_USERS,
  resources: [],
  permissions: {},
})
```

#### real-estate/src/vexcms/hooks/listings.ts

New file. Guided stub — three extracted hook/validator functions, authored via `@vexcms/core`'s factories so `doc`/`ctx` type against the real `listings` `DataModel` (see the Lifecycle hooks guide).

```ts
import { afterChangeHook, beforeChangeHook, textValidator, VexError } from "@vexcms/core"

import { TABLE_SLUG_LISTINGS } from "~/db/constants"

/**
 * Denormalizes `agentUserId` from the chosen `agentId`'s linked `agents.user`
 * so `src/auth/access.ts`'s agent-ownership rule can range over a field that
 * already equals the signed-in user's own `_id` — `defineAccess`'s `withIndex`
 * range builder only ever receives `user`, with no `ctx`/database access, so
 * it cannot resolve `agentId -> agents.user` itself.
 *
 * TODO:
 * 1. If `doc.agentId` is empty, return `{ ...doc, agentUserId: [] }`
 * 2. `const agent = await ctx.db.get(doc.agentId[0])` — relationship fields store a
 *    one-element array for `hasMany: false`
 * 3. → throw a `VexError({ code: "AGENT_NOT_FOUND" })` when `agent` is `null`
 * 4. Return `{ ...doc, agentUserId: agent.user ?? [] }`
 */
export const resolveAgentUserId = beforeChangeHook(TABLE_SLUG_LISTINGS, async ({ doc, ctx }) => {
  throw new Error("Not implemented")
})

/**
 * Keeps each agent's `activeListingCount` in sync with their own listings'
 * `status`, so `/agents/[slug]` shows a live count with no per-request
 * aggregation query.
 *
 * TODO:
 * 1. `wasActive = operation === "create" ? false : oldDoc?.status?.includes("active") === true`
 * 2. `isActive = newDoc.status.includes("active")`
 * 3. If `wasActive === isActive` AND `oldDoc?.agentId?.[0] === newDoc.agentId[0]`, return — nothing changed
 * 4. → patch `newDoc.agentId[0]`'s `activeListingCount` by `+1`/`-1` when `isActive` flipped,
 *    clamped at 0 (`ctx.db.get` then `ctx.db.patch`)
 *
 * Edge cases: an `agentId` reassignment needs the OLD agent's count decremented too, when
 * `wasActive` and `oldDoc.agentId[0]` differs from `newDoc.agentId[0]` — handle both agents
 * in the same hook run, not just `newDoc`'s.
 */
export const syncAgentActiveListingCount = afterChangeHook(
  TABLE_SLUG_LISTINGS,
  async ({ operation, oldDoc, newDoc, ctx }) => {
    throw new Error("Not implemented")
  },
)

/**
 * Rejects an `mlsId` already used by a different listing — the same
 * `vex.find` + `VexError` shape as the marketing template's `pages.slug`
 * validator.
 *
 * TODO:
 * 1. `vex.find({ collection: TABLE_SLUG_LISTINGS, withIndex: { name: "by_mls_id", range: (q) => q.eq("mlsId", value) }, limit: 1 })`
 * 2. → if a result exists AND its `_id` differs from `doc._id`, throw
 *    `VexError({ code: "MLS_ID_CONFLICT", message: \`MLS ID "${value}" is already in use.\` })`
 */
export const mlsIdUniqueValidator = textValidator(TABLE_SLUG_LISTINGS, async ({ value, doc, vex }) => {
  throw new Error("Not implemented")
})
```

#### real-estate/src/vexcms/collections/listings.ts

One edit on top of Step 14's file — adds `hooks`, `admin.view`, `admin.views`, and `admin.components.bulkActions`. Everything else (`fields`, `interfaceName`, `labels`) is unchanged.

**1 — imports.** Add alongside the existing `@vexcms/core` import:

```ts
import { MarkSoldBulkAction } from "~/vexcms/admin/MarkSoldBulkAction"
import { mlsIdUniqueValidator, resolveAgentUserId, syncAgentActiveListingCount } from "~/vexcms/hooks/listings"
```

**2 — `admin`, replacing `admin: { useAsTitle: "title", icon: "Home" }`.** Guided stub — TODO-commented, same convention as Step 14's `fields`.

```ts
  /**
   * TODO:
   * - view.sort: { field: "updatedAt", order: "desc" }
   * - view.searchFields: ["title", "mlsId"]
   * - view.columns: [{ field: "title", pinned: "left", width: 260 }, "listingType", "status",
   *   "mlsId", "agentId"]
   * - view.bulkActions: { delete: true }
   * - views: [{ viewId: "my-active-listings", name: "My active listings",
   *   description: "This agent's own listings that are still active.",
   *   state: { where: { field: "status", op: "eq", value: "active" } } }] — the "My" half
   *   comes from the agent role's own `read` rule in access.ts, not from this
   *   view's `where`; the same shared view narrows differently per signed-in agent
   * - components.bulkActions: [{ id: "realEstate.listings.markSold", component: MarkSoldBulkAction }]
   */
  admin: {},
```

**3 — `hooks`, added after `admin`.**

```ts
  hooks: {
    beforeChange: resolveAgentUserId,
    afterChange: syncAgentActiveListingCount,
  },
```

**4 — `mlsId`'s `validate`,** referenced from Step 14's field TODO (`fields.mlsId`'s `validate: mlsIdUniqueValidator`) — now that the import exists, the developer wires it in when writing the real `fields` object.

#### real-estate/src/vexcms/admin/MarkSoldBulkAction.tsx

New file. Guided stub — a `list.bulkActions` contribution, same shape as the list-views guide's generic example and `TestimonialBulkApproveAction`.

```tsx
"use client"

import type { TDocument } from "@vexcms/core"

/**
 * `realEstate.listings.markSold` — a `list.bulkActions` contribution. Calls
 * the `markSold` custom mutation (`convex/listings.ts`), never the generic
 * `update` mutation, so the server checks the `markSold` custom action —
 * not `update` — against every selected listing.
 *
 * TODO:
 * 1. `canMarkSold = usePermission({ resource: TABLE_SLUG_LISTINGS, action: "markSold", scope: PERMISSION_SCOPES.any })`
 * 2. `sellable = props.docs.filter((doc) => doc.status?.includes("sold") !== true)`
 * 3. Render nothing when `props.docs.length === 0` or `!canMarkSold`
 * 4. On click: `Promise.all(sellable.map((doc) => markSold({ id: doc._id })))`
 *    (`useMutation(api.listings.markSold)`), toast the outcome, track an `isMarking` state
 *
 * Edge cases: a selected listing the signed-in agent doesn't own still renders the button —
 * client-side gating checks only the ACTION, not per-row ownership (the Access control guide's
 * "Admin panel gating" note) — so the per-document `markSold` rejection in `src/auth/access.ts`
 * is what actually enforces "agent cannot run Mark sold on others' listings"; surface that
 * rejection as a per-row toast error, not a silent skip.
 */
interface MarkSoldBulkActionProps {
  docs: TDocument[]
}

export function MarkSoldBulkAction(props: MarkSoldBulkActionProps) {
  throw new Error("Not implemented")
}
```

#### real-estate/convex/listings.ts

New file. Trivial wiring — no guided-stub treatment needed, there is no logic here beyond the one documented `access.action` override (the [Local API guide](https://docs.vexcms.dev/guides/local-api/#per-call-access-overrides-accessaction--accessbypass)'s own pattern, applied verbatim).

```ts
import { v } from "convex/values"

import { TABLE_SLUG_LISTINGS } from "~/db/constants"

import { mutation } from "./_generated/server"
import { update } from "./vex"

/**
 * Flips a listing's `status` to `"sold"`, checked against the `markSold`
 * custom action instead of the collection's default `update` verb — an
 * agent who can edit their own listing is not necessarily allowed to run
 * this control (`src/auth/access.ts`).
 */
export const markSold = mutation({
  args: { id: v.id(TABLE_SLUG_LISTINGS) },
  handler: (ctx, args) =>
    update({
      ctx,
      collection: TABLE_SLUG_LISTINGS,
      id: args.id,
      data: { status: ["sold"] },
      access: { action: "markSold" },
    }),
})
```

**Verify:** sign in as an agent — `/admin/collections/listings` shows only that agent's own rows and a "My active listings" tab; the listing edit form's sidebar never shows Commission for an agent, but does for broker/admin; creating a second listing with a duplicate `mlsId` is rejected server-side; selecting another agent's listing and running "Mark sold" rejects with a toast; selecting the signed-in agent's own listing and running it succeeds.

### Step 16 — Real estate 04–05: seed and front end [agent] — needs developer exception

Why: a searchable listings site with galleries; the telemetry beat lives in this scenario's 15-min script.
Verify: `pnpm build` 0; `/listings?q=` search returns seeded matches; seed/reinit/reset/accounts pass; tags `real-estate/04-seed`, `real-estate/05-front-end`

- [ ] `real-estate/convex/seed.ts`
- [ ] `real-estate/convex/demoAccounts.ts`
- [ ] `real-estate/scripts/create-demo-accounts.mjs`
- [ ] `real-estate/package.json`
- [ ] `real-estate/.env.example`
- [ ] `real-estate/convex/listings.ts`
- [ ] `real-estate/convex/agents.ts`
- [ ] `real-estate/src/lib/vex.ts`
- [ ] `real-estate/src/vex.config.ts`
- [ ] `real-estate/src/app/(frontend)/page.tsx`
- [ ] `real-estate/src/app/(frontend)/listings/page.tsx`
- [ ] `real-estate/src/app/(frontend)/listings/[slug]/page.tsx`
- [ ] `real-estate/src/app/(frontend)/agents/[slug]/page.tsx`
- [ ] `real-estate/src/app/sitemap.ts`
- [ ] `real-estate/src/app/robots.ts`
- [ ] `pnpm seed` on an empty deployment; `pnpm seed:reinit`; `pnpm seed:reset`; `pnpm demo:accounts`
- [ ] tags `real-estate/04-seed`, `real-estate/05-front-end`

#### real-estate/convex/seed.ts

New file. `runSeed(ctx, mode)` mirrors `apps/www/convex/seed.ts`'s own shape (natural-key matching, `"insert" | "patch"`), plus the `reset` mutation this spec's examples add on top of it (deletes any agent/listing not in this file's own arrays, then reconciles the rest).

```ts
import { TABLE_SLUG_AGENTS, TABLE_SLUG_LISTINGS } from "~/db/constants"

import { internalMutation, type MutationCtx } from "./_generated/server"

const AGENTS = [
  { name: "Dana Reyes", slug: "dana-reyes", email: "dana.reyes@example.com", phone: "5035550101" },
  { name: "Marcus Webb", slug: "marcus-webb", email: "marcus.webb@example.com", phone: "5035550102" },
  { name: "Elena Castillo", slug: "elena-castillo", email: "elena.castillo@example.com", phone: "5035550103" },
] as const

const LISTINGS = [
  { mlsId: "RE-1001", title: "Craftsman Bungalow on Maple", slug: "craftsman-bungalow-on-maple",
    listingType: ["sale"], description: "A restored 1920s craftsman two blocks from the park.",
    contactEmail: "listings@real-estate.example", pricing: { price: 468000 },
    status: ["active"], agentSlug: "dana-reyes" },
  { mlsId: "RE-1002", title: "Downtown Loft with City Views", slug: "downtown-loft-with-city-views",
    listingType: ["rent"], description: "Open-plan loft on the 9th floor, floor-to-ceiling windows.",
    contactEmail: "listings@real-estate.example", pricing: { monthlyRent: 2200, deposit: 2200 },
    status: ["active"], agentSlug: "dana-reyes" },
  { mlsId: "RE-1003", title: "Lakeside Cottage Retreat", slug: "lakeside-cottage-retreat",
    listingType: ["sale"], description: "Three-bedroom cottage with private dock access.",
    contactEmail: "listings@real-estate.example", pricing: { price: 489000 },
    status: ["pending"], agentSlug: "marcus-webb" },
  { mlsId: "RE-1004", title: "Modern Townhome Near Transit", slug: "modern-townhome-near-transit",
    listingType: ["rent"], description: "Three-story townhome a five-minute walk from the light rail.",
    contactEmail: "listings@real-estate.example", pricing: { monthlyRent: 1850, deposit: 1850 },
    status: ["active"], agentSlug: "marcus-webb" },
  { mlsId: "RE-1005", title: "Historic Victorian Restoration", slug: "historic-victorian-restoration",
    listingType: ["sale"], description: "Fully restored Victorian with original woodwork throughout.",
    contactEmail: "listings@real-estate.example", pricing: { price: 725000 },
    status: ["sold"], agentSlug: "dana-reyes" },
  { mlsId: "RE-1006", title: "Garden-Level Studio", slug: "garden-level-studio",
    listingType: ["rent"], description: "Quiet studio with a private garden entrance.",
    contactEmail: "listings@real-estate.example", pricing: { monthlyRent: 1200, deposit: 1200 },
    status: ["active"], agentSlug: "elena-castillo" },
  { mlsId: "RE-1007", title: "Ranch House with Acreage", slug: "ranch-house-with-acreage",
    listingType: ["sale"], description: "Single-story ranch on two acres, fully fenced.",
    contactEmail: "listings@real-estate.example", pricing: { price: 615000 },
    status: ["active"], agentSlug: "marcus-webb" },
  { mlsId: "RE-1008", title: "Riverside Duplex Investment", slug: "riverside-duplex-investment",
    listingType: ["sale"], description: "Two-unit duplex, both sides currently leased.",
    contactEmail: "listings@real-estate.example", pricing: { price: 399000 },
    status: ["pending"], agentSlug: "elena-castillo" },
] as const

type SeedMode = "insert" | "patch"

/** Per-document outcome of a seed run, keyed by a stable natural label. */
export type SeedReport = {
  created: string[]
  patched: string[]
  skipped: string[]
}

/**
 * Builds the 3 agents and 8 listings every take starts from. Every document
 * is located by a natural identifier (agent slug, listing MLS id), never by
 * id, so both modes are safe to run repeatedly.
 */
async function runSeed(ctx: MutationCtx, mode: SeedMode): Promise<SeedReport> {
  const created: string[] = []
  const patched: string[] = []
  const skipped: string[] = []

  const agentIdBySlug = new Map<string, string>()
  for (const agent of AGENTS) {
    const existing = await ctx.db
      .query(TABLE_SLUG_AGENTS)
      .withIndex("by_slug", (q) => q.eq("slug", agent.slug))
      .first()
    if (existing) {
      if (mode === "patch") {
        await ctx.db.patch(existing._id, { name: agent.name, email: agent.email, phone: agent.phone })
        patched.push(`agent:${agent.slug}`)
      } else {
        skipped.push(`agent:${agent.slug}`)
      }
      agentIdBySlug.set(agent.slug, existing._id)
      continue
    }
    const id = await ctx.db.insert(TABLE_SLUG_AGENTS, {
      name: agent.name,
      slug: agent.slug,
      email: agent.email,
      phone: agent.phone,
      activeListingCount: 0,
    })
    created.push(`agent:${agent.slug}`)
    agentIdBySlug.set(agent.slug, id)
  }

  for (const listing of LISTINGS) {
    const agentId = agentIdBySlug.get(listing.agentSlug)
    if (!agentId) continue
    const doc = {
      mlsId: listing.mlsId,
      title: listing.title,
      slug: listing.slug,
      listingType: listing.listingType,
      description: listing.description,
      contactEmail: listing.contactEmail,
      pricing: listing.pricing,
      status: listing.status,
      agentId: [agentId],
    }
    const existing = await ctx.db
      .query(TABLE_SLUG_LISTINGS)
      .withIndex("by_mls_id", (q) => q.eq("mlsId", listing.mlsId))
      .first()
    if (existing) {
      if (mode === "patch") {
        await ctx.db.patch(existing._id, doc)
        patched.push(`listing:${listing.mlsId}`)
      } else {
        skipped.push(`listing:${listing.mlsId}`)
      }
      continue
    }
    await ctx.db.insert(TABLE_SLUG_LISTINGS, doc)
    created.push(`listing:${listing.mlsId}`)
  }

  return { created, patched, skipped }
}

export const init = internalMutation({
  args: {},
  handler: async (ctx) => runSeed(ctx, "insert"),
})

export const reinit = internalMutation({
  args: {},
  handler: async (ctx) => runSeed(ctx, "patch"),
})

/**
 * Deletes every agent/listing NOT present in this file's own `AGENTS`/
 * `LISTINGS` arrays, then reconciles the rest via `runSeed(ctx, "patch")` —
 * restores the exact start state between live-demo takes. `apps/www` has no
 * `reset` because its content is curated by hand; the demo examples need an
 * exact start state a recorded take can always return to.
 */
export const reset = internalMutation({
  args: {},
  handler: async (ctx) => {
    const keepListingIds = new Set(LISTINGS.map((listing) => listing.mlsId))
    const keepAgentSlugs = new Set(AGENTS.map((agent) => agent.slug))

    for (const listing of await ctx.db.query(TABLE_SLUG_LISTINGS).collect()) {
      if (!keepListingIds.has(listing.mlsId)) await ctx.db.delete(listing._id)
    }
    for (const agent of await ctx.db.query(TABLE_SLUG_AGENTS).collect()) {
      if (!keepAgentSlugs.has(agent.slug)) await ctx.db.delete(agent._id)
    }

    return runSeed(ctx, "patch")
  },
})
```

#### real-estate/convex/demoAccounts.ts

New file. Promotes a freshly signed-up account to its real role, and — for an `"agent"` account — links the matching `agents` roster profile (matched by email) and backfills `agentUserId` on every listing already assigned to that agent, since `listings`' `beforeChange` hook (Step 15) only runs for a write through the admin panel/Local API, never for this seed data's direct `ctx.db.insert` calls (the Lifecycle hooks guide's "Coverage limits"). Identical in shape to `magazine/convex/demoAccounts.ts` (Step 9) except this `ROLE` map (admin/broker/agent here vs. admin/editor/author there) and the agent-linking step, which magazine's flat author/editor roles don't need.

```ts
import { v } from "convex/values"

import { TABLE_SLUG_AGENTS, TABLE_SLUG_LISTINGS, TABLE_SLUG_USERS } from "~/db/constants"

import { internalMutation } from "./_generated/server"

export const setRoles = internalMutation({
  args: {
    accounts: v.array(
      v.object({
        email: v.string(),
        roles: v.array(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const account of args.accounts) {
      const user = await ctx.db
        .query(TABLE_SLUG_USERS)
        .withIndex("by_email", (q) => q.eq("email", account.email))
        .first()
      if (!user) continue

      await ctx.db.patch(user._id, { roles: account.roles })

      if (!account.roles.includes("agent")) continue

      const agent = await ctx.db
        .query(TABLE_SLUG_AGENTS)
        .withIndex("by_email", (q) => q.eq("email", account.email))
        .first()
      if (!agent) continue

      await ctx.db.patch(agent._id, { user: [user._id] })

      const listings = await ctx.db
        .query(TABLE_SLUG_LISTINGS)
        .withIndex("by_agentId", (q) => q.eq("agentId", [agent._id]))
        .collect()
      for (const listing of listings) {
        await ctx.db.patch(listing._id, { agentUserId: [user._id] })
      }
    }
  },
})
```

#### real-estate/scripts/create-demo-accounts.mjs

New file. Identical in structure to `magazine/scripts/create-demo-accounts.mjs` (Step 9) — HTTP sign-up over `/api/auth/sign-up/email`, then `npx convex run demoAccounts:setRoles`. The only differences: the `ACCOUNTS` list (4 entries — admin/broker/2 agents — vs. magazine's 3) and the default dev `SITE_URL` port (3210 vs. 3200). The agent-linking logic lives entirely in `demoAccounts.ts`, not here.

```js
#!/usr/bin/env node
import { execSync } from "node:child_process"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3210"

function requireEnv(key) {
  const value = process.env[key]
  if (!value) throw new Error(`Missing ${key} in .env.local`)
  return value
}

const ACCOUNTS = [
  { name: "Admin", email: requireEnv("DEMO_ADMIN_EMAIL"), password: requireEnv("DEMO_ADMIN_PASSWORD"), roles: ["admin"] },
  { name: "Priya Shah", email: requireEnv("DEMO_BROKER_EMAIL"), password: requireEnv("DEMO_BROKER_PASSWORD"), roles: ["broker"] },
  { name: "Dana Reyes", email: requireEnv("DEMO_AGENT1_EMAIL"), password: requireEnv("DEMO_AGENT1_PASSWORD"), roles: ["agent"] },
  { name: "Marcus Webb", email: requireEnv("DEMO_AGENT2_EMAIL"), password: requireEnv("DEMO_AGENT2_PASSWORD"), roles: ["agent"] },
]

async function signUp(account) {
  const response = await fetch(`${SITE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: account.email, password: account.password, name: account.name }),
  })
  if (!response.ok && response.status !== 422) {
    throw new Error(`Sign-up failed for ${account.email}: ${response.status} ${await response.text()}`)
  }
}

async function main() {
  for (const account of ACCOUNTS) {
    await signUp(account)
    console.log(`[demo:accounts] signed up ${account.email}`)
  }

  const payload = JSON.stringify({
    accounts: ACCOUNTS.map(({ email, roles }) => ({ email, roles })),
  })
  execSync(`npx convex run demoAccounts:setRoles '${payload}'`, { stdio: "inherit" })
}

await main()
```

#### real-estate/package.json

Four edits in `scripts`. Everything else unchanged.

```json
    "seed": "convex run seed:init",
    "seed:reinit": "convex run seed:reinit",
    "seed:reset": "convex run seed:reset",
    "demo:accounts": "node scripts/create-demo-accounts.mjs",
```

#### real-estate/.env.example

One edit — append after the existing `BETTER_AUTH_SECRET` line.

```bash
# Demo accounts (scripts/create-demo-accounts.mjs) — never set real secrets here.
DEMO_ADMIN_EMAIL=""
DEMO_ADMIN_PASSWORD=""
DEMO_BROKER_EMAIL=""
DEMO_BROKER_PASSWORD=""
DEMO_AGENT1_EMAIL=""
DEMO_AGENT1_PASSWORD=""
DEMO_AGENT2_EMAIL=""
DEMO_AGENT2_PASSWORD=""
```

#### real-estate/convex/listings.ts

One edit on top of Step 15's file — three read-only query functions for the public front end, all opted out of RBAC via `access: { bypass: true }`... actually not needed: `anonRole: "visitor"` (Step 15) already resolves an unauthenticated caller to a real, narrowly-scoped role, so these read through ordinary `find`/`search` with no bypass.

```ts
import { query } from "./_generated/server"
import { find, search } from "./vex"

export const getBySlug = query({
  args: { slug: v.string() },
  handler: (ctx, args) =>
    find({
      ctx,
      collection: TABLE_SLUG_LISTINGS,
      withIndex: { name: "by_slug", range: (q) => q.eq("slug", args.slug) },
      limit: 1,
    }),
})

export const searchListings = query({
  args: { query: v.string() },
  handler: (ctx, args) =>
    search({
      ctx,
      collection: TABLE_SLUG_LISTINGS,
      query: args.query,
      searchIndexName: "search_listings_title",
      searchField: "title",
      limit: 24,
    }),
})

export const publishedSlugs = query({
  args: {},
  handler: (ctx) => find({ ctx, collection: TABLE_SLUG_LISTINGS }),
})
```

#### real-estate/convex/agents.ts

New file.

```ts
import { v } from "convex/values"

import { TABLE_SLUG_AGENTS, TABLE_SLUG_LISTINGS } from "~/db/constants"

import { query } from "./_generated/server"
import { find } from "./vex"

export const getBySlug = query({
  args: { slug: v.string() },
  handler: (ctx, args) =>
    find({
      ctx,
      collection: TABLE_SLUG_AGENTS,
      withIndex: { name: "by_slug", range: (q) => q.eq("slug", args.slug) },
      limit: 1,
    }),
})

export const listingsByAgent = query({
  args: { agentId: v.id(TABLE_SLUG_AGENTS) },
  handler: (ctx, args) =>
    find({
      ctx,
      collection: TABLE_SLUG_LISTINGS,
      withIndex: { name: "by_agentId", range: (q) => q.eq("agentId", [args.agentId]) },
    }),
})
```

#### real-estate/src/lib/vex.ts

New file — the one shared cached read client (caching-and-seo guide).

```ts
import { createVexServerClient } from "@vexcms/next/cache"

import { env } from "~/env.mjs"

export const vex = createVexServerClient({ url: env.NEXT_PUBLIC_CONVEX_URL })
```

#### real-estate/src/vex.config.ts

One edit on top of Step 14's file — adds `routes.map`, which is what drives both the sitemap and the admin panel's automatic purge-on-write.

```ts
  routes: {
    map: ({ collection, doc }) => {
      if (collection === TABLE_SLUG_LISTINGS && typeof doc.slug === "string") {
        return [`/listings/${doc.slug}`, "/listings"]
      }
      if (collection === TABLE_SLUG_AGENTS && typeof doc.slug === "string") {
        return [`/agents/${doc.slug}`]
      }
      return []
    },
  },
```

#### real-estate/src/app/(frontend)/page.tsx

Replaces the scaffold's `WelcomePage` placeholder in full.

```tsx
import { api } from "@convex/_generated/api"
import Link from "next/link"

import { vex } from "~/lib/vex"

export const revalidate = 3600

export default async function HomePage() {
  const listings = (await vex.query(api.listings.publishedSlugs, {})).slice(0, 6)

  return (
    <main>
      <h1>Real Estate</h1>
      <p>
        <Link href="/listings">Browse every listing</Link>
      </p>
      <ul>
        {listings.map((listing) => (
          <li key={listing._id}>
            <Link href={`/listings/${listing.slug}`}>{listing.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

#### real-estate/src/app/(frontend)/listings/page.tsx

New file — `?q=` search via the Local API's `search`.

```tsx
import { api } from "@convex/_generated/api"
import Link from "next/link"

import { vex } from "~/lib/vex"

export const revalidate = 3600

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const listings = await vex.query(api.listings.searchListings, { query: q ?? "" })

  return (
    <main>
      <h1>Listings</h1>
      <form>
        <input type="search" name="q" defaultValue={q} placeholder="Search listings" />
      </form>
      <ul>
        {listings.map((listing) => (
          <li key={listing._id}>
            <Link href={`/listings/${listing.slug}`}>{listing.title}</Link> — {listing.status[0]}
          </li>
        ))}
      </ul>
    </main>
  )
}
```

#### real-estate/src/app/(frontend)/listings/[slug]/page.tsx

New file — gallery resolved through `vex/media:getUrl`, the same server-side pattern `apps/test/src/lib/metadata.ts` uses.

```tsx
import { api } from "@convex/_generated/api"
import { notFound } from "next/navigation"

import { vex } from "~/lib/vex"

export const revalidate = 3600

async function resolveMediaUrl(mediaId: string) {
  const result = (await vex.query(api.vex.media.getUrl, { adapter: "convex", mediaId })) as {
    url?: string
    error?: string
  }
  return result.url
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [listing] = await vex.query(api.listings.getBySlug, { slug })
  if (!listing) notFound()

  const galleryUrls = await Promise.all((listing.gallery ?? []).map(resolveMediaUrl))

  return (
    <main>
      <h1>{listing.title}</h1>
      <p>{listing.description}</p>
      <ul>
        {galleryUrls
          .filter((url): url is string => Boolean(url))
          .map((url) => (
            <li key={url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={listing.title} />
            </li>
          ))}
      </ul>
    </main>
  )
}
```

#### real-estate/src/app/(frontend)/agents/[slug]/page.tsx

New file.

```tsx
import { api } from "@convex/_generated/api"
import { notFound } from "next/navigation"
import Link from "next/link"

import { vex } from "~/lib/vex"

export const revalidate = 3600

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [agent] = await vex.query(api.agents.getBySlug, { slug })
  if (!agent) notFound()

  const listings = await vex.query(api.agents.listingsByAgent, { agentId: agent._id })

  return (
    <main>
      <h1>{agent.name}</h1>
      <p>{agent.activeListingCount} active listings</p>
      <ul>
        {listings.map((listing) => (
          <li key={listing._id}>
            <Link href={`/listings/${listing.slug}`}>{listing.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

#### real-estate/src/app/sitemap.ts

New file.

```ts
import { api } from "@convex/_generated/api"
import { createVexSitemap } from "@vexcms/next/seo"

import { env } from "~/env.mjs"
import { vex } from "~/lib/vex"

export default createVexSitemap({
  client: vex,
  query: api.listings.publishedSlugs,
  toUrl: (slug) => `${env.NEXT_PUBLIC_SITE_URL}/listings/${slug}`,
  getSlug: (item) => item.slug,
})
```

#### real-estate/src/app/robots.ts

New file.

```ts
import { createVexRobots } from "@vexcms/next/seo"

import { env } from "~/env.mjs"

export default createVexRobots({
  siteUrl: env.NEXT_PUBLIC_SITE_URL,
  disallow: ["/admin", "/api"],
})
```

**Verify:** `pnpm build` prints `○`/`●` for `/`, `/listings`, `/listings/[slug]`, `/agents/[slug]` (no `ƒ`); `/listings?q=loft` returns the seeded "Downtown Loft with City Views"; `pnpm seed` on an empty deployment creates 3 agents + 8 listings; `pnpm seed:reinit` restores an edited listing; `pnpm seed:reset` removes a demo-created listing and restores the start state; `pnpm demo:accounts` creates the 4 accounts, sets their roles, and links Dana/Marcus to their agent profiles (Elena stays unlinked — no demo login for her).

### Step 17 — Real estate 06: deploy, playbook, run-through [agent] — needs developer exception

Why: the developer owns the production deploy himself (decision 6); the agent verifies it, closes sign-up,
and records it, exactly once magazine's Step 11 establishes the pattern.
Waits for: human — real-estate Convex prod + Vercel project + env set up (`CONVEX_DEPLOY_KEY`
Production-scoped, Vercel build command `pnpm vex:deploy --cmd 'pnpm build'`, first sign-up done
by the developer so that account becomes admin).
Verify: prod URL 200; `golden-runthrough.md` § real-estate all `pass`; tag `real-estate/06-deployed`

- [ ] check the production build log: `vex deploy --cmd 'pnpm build'` ran exactly once, on the final
      push, and the Next.js build it triggered succeeded (Step 3's `vex deploy` flag-passthrough fix)
- [ ] `npx convex run seed:init --prod` (3 agents + 8 listings)
- [ ] verify the prod URL returns 200 with the seeded listings/agents, and `/admin` sign-in works
      with the developer's own account
- [ ] sign-up lockdown (decision 21): confirm the developer already signed up first → run
      `pnpm demo:accounts` against the prod URL → `npx convex env set AUTH_DISABLE_SIGN_UP true --prod`;
      verify `POST /api/auth/sign-up/email` on prod now returns an error status, and signing in with
      a demo account still works
- [ ] `real-estate/README.md` — add the "Live demo" line (site URL, `/admin`)
- [ ] fix `guides/deployment.mdx` for any deviation from what the production build log actually shows
- [ ] `.agent/docs/specs/2026-11-09-golden-use-cases/playbooks/real-estate.md`
- [ ] `.agent/docs/specs/2026-11-09-golden-use-cases/golden-runthrough.md` — append `## real-estate`
- [ ] tag `real-estate/06-deployed`

#### .agent/docs/specs/2026-11-09-golden-use-cases/playbooks/real-estate.md

New file.

````markdown
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

D4 alternate (owner rules, field maps, saved views, bulk action) — `launch-kit.md`'s D4 fact
sheet gains a real estate reference alongside magazine's.

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
````

#### .agent/docs/specs/2026-11-09-golden-use-cases/golden-runthrough.md

Existing file by this point (created in magazine's Step 12). One edit: append `## real-estate`
directly after the existing `## magazine` section, mirroring
`2026-11-06-launch-infrastructure/n-runthrough.md`'s table shape. All rows `pending` until this
step is actually run.

```markdown
## real-estate

Run against the published `create-vexcms@0.1.0-alpha.35` / `@vexcms/*@0.1.0-alpha.35`, scaffolded
`--bare` on port 3210, against `vex-example-real-estate`. Transcript: `/tmp/create-real-estate.log`.

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Scaffold | `pnpm create vexcms@alpha real-estate --bare` | Install, lint, format succeed | pending |
| `vex dev` generates | `pnpm vex:dev` | `_generated`, `vex.schema.ts`, `vex.types.ts` present; functions push | pending |
| First-user signup becomes admin | sign up at `/auth/sign-up` | Redirected to `/admin`; `roles` includes `admin` | pending |
| `pnpm typecheck` after collections | `pnpm typecheck` | 0 | pending |
| Listing form renders tabs | `/admin/collections/listings`, create | Details/Pricing/Media tabs; Pricing swaps fields on `listingType` | pending |
| Gallery upload with `accept` | upload 2 images to `gallery` | both attached, non-image rejected by the file picker | pending |
| Open houses array | add 2 rows under the Open Houses collapsible | both saved, `date` + `notes` each | pending |
| Agent sees only own listings in "My active listings" | sign in as Dana, open the tab | only Dana's active rows | pending |
| Commission hidden from agent | open any listing as Dana, then as broker | absent for Dana, present for broker | pending |
| MLS id unique | create a second listing with an existing `mlsId` | server rejects, field-attributed error | pending |
| Mark sold bulk action | select own listing, run "Mark sold" | `status` becomes `sold` | pending |
| Agent cannot run Mark sold on others' listings | select another agent's listing as Dana, run it | rejected, per-row error | pending |
| Saved-view permissions | as Dana: Save-as-new disabled on "My active listings"; as broker: enabled | matches `createView`/`updateView` per role | pending |
| `pnpm build` | `pnpm build` | 0; `/`, `/listings`, `/listings/[slug]`, `/agents/[slug]` print `○`/`●`, never `ƒ` | pending |
| `/listings?q=` search | `/listings?q=loft` | returns "Downtown Loft with City Views" | pending |
| `pnpm seed` on empty deployment | `pnpm seed` | 3 agents + 8 listings created | pending |
| `pnpm seed:reinit` | edit a listing, then `pnpm seed:reinit` | edit reverted to seeded value | pending |
| `pnpm seed:reset` | create an extra listing, then `pnpm seed:reset` | extra listing deleted, seeded 8 restored | pending |
| `pnpm demo:accounts` | `pnpm demo:accounts` | 4 accounts created, roles set, Dana/Marcus linked to their agent profiles | pending |
| `vex telemetry status` beat | `vex telemetry status --json` | prints `features.access.fieldPermissionRuleCount` > 0 | pending |
| Filter builder beat | `/admin/collections/listings`, AND `status` + `listingType` | chip row shows both conditions, results narrow | pending |
| Peek panel beat | double-click a row | non-modal panel opens, Next/Previous wrap | pending |
| Pagination beat | page through `/admin/collections/listings` with page size 5 | 8 listings across 2 pages | pending |
| Deploy | human sets up Convex prod + Vercel project + env, triggers the build | production build log shows `vex deploy --cmd 'pnpm build'` ran once; prod URL 200; `/admin` sign-in works | pending |
| Prod seed + accounts | `npx convex run seed:init --prod`, `pnpm demo:accounts` against the prod URL | 3 agents + 8 listings created; 4 accounts created and linked | pending |
| Sign-up lockdown | `npx convex env set AUTH_DISABLE_SIGN_UP true --prod` | `POST /api/auth/sign-up/email` on prod returns an error status; sign-in with a demo account still works | pending |
| 5-min script | run the playbook's 5 beats | each beat's "On screen" state reproducible | pending |
| 15-min script | run the playbook's 7 beats | each beat's "On screen" state reproducible | pending |
| Shot: `real-estate-tabbed-listing-form.mp4` | capture per `media-session.md` | ≤ 60 s, H.264, no audio, ≤ 10 MB | pending |
| Shot: `real-estate-owner-rules-bulk-action.mp4` | capture per `media-session.md` | ≤ 60 s, H.264, no audio, ≤ 10 MB | pending |
| Shot: `real-estate-search-and-gallery.mp4` | capture per `media-session.md` | ≤ 60 s, H.264, no audio, ≤ 10 MB | pending |
```

**Verify:** `https://<vercel-prod>/` 200 with the seeded listings; `/admin` sign-in works; every deviation from `guides/deployment.mdx` fixed in the monorepo; `golden-runthrough.md` § real-estate rows move from `pending` to `pass` as each is actually run; tag `real-estate/06-deployed` pushed.

### Step 18 — Conference 01–02: scaffold, collections, global, blocks, OAuth [dev] — needs developer exception

Why: starts from the marketing template; adds speakers/sessions, an event global and GitHub sign-in.
Waits for: GU-12; human — GitHub OAuth app (dev callback).

- [ ] `pnpm create vexcms@alpha conference` (marketing-site template — the default scaffold, no `--bare`), port 3220, Convex project `vex-example-conference`; "GitHub" selected at prompt 6/8 ("Select OAuth providers")
- [ ] human: GitHub OAuth App, Authorization callback URL `http://localhost:3220/api/auth/callback/github`; `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` set on the dev deployment (`npx convex env set`, same step as `SITE_URL`/`BETTER_AUTH_SECRET`)
- [ ] `src/db/constants/index.ts` — `TABLE_SLUG_SPEAKERS`, `TABLE_SLUG_CONFERENCE_SESSIONS`, `GLOBAL_SLUG_EVENT_SETTINGS`
- [ ] `src/vexcms/collections/speakers.ts`
- [ ] `src/vexcms/collections/sessions.ts`
- [ ] `src/vexcms/collections/index.ts`
- [ ] `src/vexcms/globals/eventSettings.ts`
- [ ] `src/vexcms/globals/index.ts`
- [ ] `src/vexcms/admin/EventCountdown.tsx`
- [ ] `src/vexcms/blocks/constants.ts`
- [ ] `src/vexcms/blocks/ScheduleEmbed/config.ts`
- [ ] `src/vexcms/blocks/ScheduleEmbed/index.tsx`
- [ ] `src/vexcms/blocks/config.ts`
- [ ] `src/vexcms/blocks/index.ts`
- [ ] `src/vex.config.ts`
- [ ] `pnpm vex:dev` — regenerate `convex/vex.schema.ts` + `src/vex.types.ts`
- [ ] `git tag conference/01-scaffold`, `git tag conference/02-collections`

The scaffold answers the marketing-site template (not `--bare`, matching `restaurant`'s own marketing
start): project name `conference`, port `3220` (overriding the default `3010`), Convex project
`vex-example-conference`, email/password yes, organizations no, OAuth providers → GitHub, git init
yes, install yes. Choosing GitHub at prompt 6/8 makes the CLI installer (`updateOAuthConfig`,
`updateOAuthUIConfig`, `updateEnvExample`, `updateEnvTs`, `updateReadme` —
`packages/create-vexcms/src/installers/nextjs.ts`) fill `convex/auth/options.ts`'s
`// {{OAUTH_PROVIDERS}}` with Better Auth's `github({ clientId: process.env.GITHUB_CLIENT_ID!,
clientSecret: process.env.GITHUB_CLIENT_SECRET! })`, `src/auth/AuthViewProvider.tsx`'s
`// {{OAUTH_UI_PROVIDERS}}` with `"github"`, and `.env.example`/`src/env.mjs`/`README.md` with the two
env var names — no hand-written OAuth wiring in this step.

`TABLE_SLUG_SESSIONS` already names Better Auth's own session table (`"session"`, singular,
`src/db/constants/auth.ts`) — the new content collection's constant is `TABLE_SLUG_CONFERENCE_SESSIONS`
to avoid a duplicate top-level `export const` in the same `index.ts`, while the collection's own
`slug` stays the plain `"sessions"` string everywhere it is user-facing (admin sidebar, Convex table
name, URLs).

#### src/db/constants/index.ts

4 new lines, anchored after `export const GLOBAL_SLUG_SITE_SETTINGS = "siteSettings" as const`
(everything above is unchanged):

```ts
// Conference content
export const TABLE_SLUG_SPEAKERS = "speakers" as const
export const TABLE_SLUG_CONFERENCE_SESSIONS = "sessions" as const
export const GLOBAL_SLUG_EVENT_SETTINGS = "eventSettings" as const
```

#### src/vexcms/collections/speakers.ts

New file. Compiling `defineCollection` skeleton — `slug`, `labels`, `admin.icon`, `admin.livePreview`
are real; `fields` is numbered-TODO per code-rules.md.

```ts
import { defineCollection } from "@vexcms/core"

import { TABLE_SLUG_SPEAKERS } from "~/db/constants"

/**
 * Conference speakers.
 *
 * TODO: implement `fields`
 * 1. name → `text({ label: "Name", required: true })`
 * 2. slug → `text<typeof TABLE_SLUG_SPEAKERS>({ label: "Slug", required: true, index: "by_slug",
 *    validate: async ({ value, doc, vex }) => { … } })` — mirror `pages.ts`'s slug `validate`:
 *    `vex.find({ collection: TABLE_SLUG_SPEAKERS, withIndex: { name: "by_slug", range: (q) =>
 *    q.eq("slug", value) }, limit: 1 })`, throw `VexError({ code: "SLUG_CONFLICT", message })` when a
 *    match exists whose `_id !== doc._id`
 * 3. bio → `richtext({ label: "Bio" })`
 * 4. photo → `upload({ to: TABLE_SLUG_IMAGES, label: "Photo" })`
 * 5. sessionCount → `number({ label: "Session Count", defaultValue: 0, admin: { readOnly: true,
 *    position: "sidebar" } })` — maintained by `sessions`' `afterChange`/`afterDelete` hooks
 *    and never written from the admin form
 */
export const speakers = defineCollection({
  slug: TABLE_SLUG_SPEAKERS,
  labels: {
    singular: "Speaker",
    plural: "Speakers",
  },
  admin: {
    useAsTitle: "name",
    icon: "Mic",
    livePreview: {
      url: (doc) => `/speakers/${doc.slug}`,
    },
  },
  fields: {},
})
```

#### src/vexcms/collections/sessions.ts

New file. Same guided-stub tier as `speakers.ts`.

```ts
import { defineCollection } from "@vexcms/core"

import { TABLE_SLUG_CONFERENCE_SESSIONS } from "~/db/constants"

/**
 * Conference talks/panels.
 *
 * TODO: implement `fields`
 * 1. title → `text({ label: "Title", required: true })`
 * 2. slug → `text<typeof TABLE_SLUG_CONFERENCE_SESSIONS>({ label: "Slug", required: true,
 *    index: "by_slug", validate: … })` — same `vex.find`/`VexError` shape as `speakers.ts`#2
 * 3. abstract → `textarea({ label: "Abstract" })`
 * 4. speakers → `relationship({ collection: { slug: TABLE_SLUG_SPEAKERS }, hasMany: true, label:
 *    "Speakers" })` — auto-generates a `by_speakers` index
 * 5. room → `select({ label: "Room", index: "by_room", options: [{ label: "Hall A", value:
 *    "hall-a" }, { label: "Hall B", value: "hall-b" }] })` — Step 19 adds `validate` here (room/slot
 *    clash)
 * 6. startsAt → `date({ label: "Starts At", required: true })`
 * 7. durationMinutes → `number({ label: "Duration (minutes)", required: true, min: [5, "Must be at
 *    least 5 minutes"] })`
 * 8. track → `select({ label: "Track", options: [{ label: "Engineering", value: "engineering" },
 *    { label: "Product", value: "product" }] })`
 * 9. isKeynote → `checkbox({ label: "Keynote" })`
 * 10. resources → `json({ label: "Resources", description: "e.g. { slides: url, video: url }" })`
 */
export const sessions = defineCollection({
  slug: TABLE_SLUG_CONFERENCE_SESSIONS,
  labels: {
    singular: "Session",
    plural: "Sessions",
  },
  admin: {
    useAsTitle: "title",
    icon: "CalendarClock",
    livePreview: {
      url: (doc) => `/sessions/${doc.slug}`,
    },
  },
  fields: {},
})
```

#### src/vexcms/collections/index.ts

2 new lines, anchored alongside the existing barrel exports (everything else unchanged):

```ts
export * from "./sessions"
export * from "./speakers"
```

#### src/vexcms/globals/eventSettings.ts

New file. Compiling `defineGlobal` skeleton — `slug`, `label`, `admin.icon`, `admin.livePreview` are
real; `fields` is numbered-TODO. `dates`/`venue` are `group()` (per-field factory shown in full since
`group`'s own options are not themselves business logic); `countdown` is the `ui()` slot contribution.

```ts
import { defineGlobal, group } from "@vexcms/core"

import { GLOBAL_SLUG_EVENT_SETTINGS } from "~/db/constants"
import { EventCountdown } from "~/vexcms/admin/EventCountdown"

/**
 * Conference-wide event details, singleton.
 *
 * TODO: implement `name`
 * 1. name → `text({ label: "Event Name", required: true })`
 */
export const eventSettings = defineGlobal({
  slug: GLOBAL_SLUG_EVENT_SETTINGS,
  label: "Event Settings",
  admin: {
    icon: "CalendarRange",
    livePreview: {
      url: "/schedule",
    },
  },
  fields: {
    dates: group({
      label: "Event Dates",
      fields: {
        startDate: { type: "date", label: "Start Date", required: true } as never, // TODO: `date({ required: true, label: "Start Date" })`
        endDate: { type: "date", label: "End Date", required: true } as never, // TODO: `date({ required: true, label: "End Date" })`
      },
    }),
    venue: group({
      label: "Venue",
      fields: {
        name: { type: "text", label: "Venue Name", required: true } as never, // TODO: `text({ required: true, label: "Venue Name" })`
        address: { type: "text", label: "Address" } as never, // TODO: `text({ label: "Address" })`
        mapUrl: { type: "url", label: "Map Link" } as never, // TODO: `url({ label: "Map Link" })`
      },
    }),
    countdown: {
      type: "ui",
      label: "Countdown",
      admin: { components: { Field: EventCountdown } },
    } as never, // TODO: `ui({ label: "Countdown", admin: { components: { Field: EventCountdown } } })`
  },
})
```

#### src/vexcms/globals/index.ts

1 new line, anchored alongside the existing `export * from "./siteSettings"` (unchanged):

```ts
export * from "./eventSettings"
```

#### src/vexcms/admin/EventCountdown.tsx

New file. Function stub — signature, full JSDoc, numbered TODO, `throw new Error("Not implemented")`.
Mirrors the per-instance `ui()` `Field` component convention (`src/vexcms/admin/WordCountField.tsx`
elsewhere in the project family).

```tsx
"use client"

import type { UIFieldComponentProps } from "@vexcms/core"

/**
 * Live countdown to `eventSettings.dates.startDate`, rendered in the
 * global's edit view beside the date fields it reads.
 *
 * @param props.data - The `eventSettings` document as currently edited (includes unsaved form state).
 * @param props.name - This field's key (`"countdown"`).
 * @returns A read-only countdown string.
 */
export function EventCountdown(props: UIFieldComponentProps) {
  // TODO: implement
  // 1. read `props.data.dates?.startDate` / `.endDate` (ms timestamps, undefined until set)
  // 2. a. no `startDate` → render "Set a start date to show the countdown"
  //    b. `Date.now() < startDate` → render days/hours/minutes until `startDate`, ticking on a
  //       `setInterval(1000)` + local `useState` so it updates while the panel stays open
  //    c. `endDate` set and `Date.now() > endDate` → render "Event has ended"
  //    d. otherwise → render "Happening now"
  throw new Error("Not implemented")
}
```

#### src/vexcms/blocks/constants.ts

1 new line, anchored alongside the existing `BLOCK_SLUG_*` constants (unchanged):

```ts
export const BLOCK_SLUG_SCHEDULE_EMBED = "schedule_embed" as const
```

#### src/vexcms/blocks/ScheduleEmbed/config.ts

New file. Guided stub, following the `vexcms-block-module` convention (PascalCase block directory,
`config.ts` + `index.tsx`).

```ts
import { defineBlock } from "@vexcms/core"

import { BLOCK_SLUG_SCHEDULE_EMBED } from "../constants"

/**
 * TODO: implement `fields`
 * 1. heading → `text({ label: "Heading", defaultValue: "Schedule" })`
 * 2. showPastSessions → `checkbox({ label: "Show Past Sessions", defaultValue: false })`
 */
export const scheduleEmbedBlock = defineBlock({
  slug: BLOCK_SLUG_SCHEDULE_EMBED,
  label: "Schedule Embed",
  admin: {
    icon: "CalendarDays",
  },
  fields: {},
})
```

#### src/vexcms/blocks/ScheduleEmbed/index.tsx

New file. Function stub.

```tsx
"use client"

import type { BlockComponentProps } from "@vexcms/react"

export { scheduleEmbedBlock } from "./config"

/**
 * Renders the next few upcoming conference sessions inline on a marketing
 * page — reads the live schedule, not a static snapshot of `block`'s data.
 *
 * @param props.block - This block instance's data (`heading`, `showPastSessions`).
 * @returns A short, live list of upcoming sessions.
 */
export default function ScheduleEmbedBlock(props: BlockComponentProps) {
  // TODO: implement
  // 1. cast `props.block as ScheduleEmbedBlock` (generated type, `~/vex.types`)
  // 2. `useQuery(convexQuery(api.sessions.all, {}))` — same client-query pattern as `PageContent.tsx`
  // 3. a. `showPastSessions` false (default) → filter to `startsAt >= Date.now()`
  //    b. sort by `startsAt`, take the first 3–5
  // 4. render `heading`, then each session's title/room/time linking to `/sessions/${session.slug}`
  throw new Error("Not implemented")
}
```

#### src/vexcms/blocks/config.ts

2 edits. Everything else in this file (the other 10 block imports/exports) is unchanged.

1 — import, anchored beside the existing `import { roadmapBlock } from "./Roadmap/config"` block:

```ts
import { scheduleEmbedBlock } from "./ScheduleEmbed/config"
```

2 — `pageBlocks` array and the re-export list, anchored on the existing `export const pageBlocks = [...]` and the trailing `export { … }` block:

```ts
export const pageBlocks = [
  heroBlock,
  statsBlock,
  featuresBlock,
  codeShowcaseBlock,
  splitBlock,
  howItWorksBlock,
  roadmapBlock,
  faqBlock,
  ctaBlock,
  scheduleEmbedBlock,
]
```

```ts
export {
  codeShowcaseBlock,
  ctaBlock,
  faqBlock,
  featuresBlock,
  footerBlock,
  headerBlock,
  heroBlock,
  howItWorksBlock,
  roadmapBlock,
  scheduleEmbedBlock,
  splitBlock,
  statsBlock,
}
```

#### src/vexcms/blocks/index.ts

2 edits. Everything else (the other 10 component imports/map entries) is unchanged.

1 — import, anchored beside `import SplitBlock from "./Split"`:

```ts
import ScheduleEmbedBlock from "./ScheduleEmbed"
```

2 — `blockComponents` map, anchored on the existing object literal (also add the constant to the
`./constants` import list above it):

```ts
export const blockComponents: Record<string, ComponentType<BlockComponentProps>> = {
  [BLOCK_SLUG_CODE_SHOWCASE]: CodeShowcaseBlock,
  [BLOCK_SLUG_CTA]: CTABlock,
  [BLOCK_SLUG_FAQ]: FAQBlock,
  [BLOCK_SLUG_FEATURES]: FeaturesBlock,
  [BLOCK_SLUG_FOOTER]: FooterBlock,
  [BLOCK_SLUG_HEADER]: HeaderBlock,
  [BLOCK_SLUG_HERO]: HeroBlock,
  [BLOCK_SLUG_HOW_IT_WORKS]: HowItWorksBlock,
  [BLOCK_SLUG_ROADMAP]: RoadmapBlock,
  [BLOCK_SLUG_SCHEDULE_EMBED]: ScheduleEmbedBlock,
  [BLOCK_SLUG_SPLIT]: SplitBlock,
  [BLOCK_SLUG_STATS]: StatsBlock,
}
```

#### src/vex.config.ts

2 edits, anchored on the two import lines and the `collections`/`globals` arrays — everything else
(`access`, `authCollections`, `admin.sidebar`, `admin.livePreview.collections`/`.globals`, `storage`,
`mediaCollections`, `routes.map`) is unchanged.

```ts
import { footers, headers, images, pages, sessions, speakers, themes, users } from "~/vexcms/collections"
import { eventSettings, siteSettings } from "~/vexcms/globals"
```

```ts
  collections: [users, pages, headers, footers, themes, sessions, speakers],
  mediaCollections: [images],
  globals: [siteSettings, eventSettings],
```

Verify: `pnpm typecheck` 0; admin shows Speakers, Sessions, Event settings; GitHub sign-in reaches
`/admin`; tags `conference/01-scaffold`, `conference/02-collections`

---

### Step 19 — Conference 03: access, hooks, validation [dev] — needs developer exception

Why: the D3/D4 alternate — a cross-document `validate()` rejects a room/slot clash; triggers keep
counters; the public admin is read-only via `anonRole`.

- [ ] `src/auth/access.ts`
- [ ] `src/vexcms/collections/sessions.ts` (hooks + room `validate`)
- [ ] `src/vexcms/collections/speakers.ts` (`beforeDelete` hook)
- [ ] `convex/auth/options.ts`
- [ ] `git tag conference/03-access`

`anonRole: USER_ROLES.user` already ships in every scaffold's default `access.ts` (base-nextjs's own
template file) — this step does not add it. What it adds: `speakers`/`sessions`/`eventSettings` as
RBAC resources with a read-only grant for `user`, and flips `adminPanel.access` from the scaffold's
default `false` to `true` for that role, so an unauthenticated visitor — who resolves to `user` via
`anonRole` — can open `/admin` and see Speakers/Sessions/Event settings, read-only, exactly as
`apps/www`'s own `user` role does for its live-demo content.

#### src/auth/access.ts

4 edits. Everything else (the file's own doc comment, `admin`'s `"*": true`, the `user` role's
existing `images`/`user` entries) is unchanged.

1 — imports, anchored on the existing `import { images, users } from "~/vexcms/collections"`:

```ts
import { images, sessions, speakers, users } from "~/vexcms/collections"
import { eventSettings } from "~/vexcms/globals"
```

2 — a shared read-only shape, anchored above `export const access = defineAccess({` (mirrors
`apps/www/src/auth/access.ts`'s own `readOnly` const):

```ts
const readOnly = {
  "*": false,
  read: true,
}
```

3 — `resources`, anchored on the existing `resources: [images, users],`:

```ts
  resources: [images, users, speakers, sessions, eventSettings],
```

4 — the `user` role's `adminPanel` entry and three new resource entries, anchored on the existing
`adminPanel: { access: false },` inside `permissions[USER_ROLES.user]`:

```ts
      adminPanel: {
        access: true,
        impersonate: false,
      },
      speakers: readOnly,
      sessions: readOnly,
      eventSettings: readOnly,
```

#### src/vexcms/collections/sessions.ts

2 edits on top of Step 18's file. Everything else (imports already present, `labels`, `admin`,
`fields`'s existing TODO list) is unchanged.

1 — two new hook functions, anchored above `export const sessions = defineCollection({` (add
`afterChangeHook, afterDeleteHook, FieldValidateProps, VexError` to the `@vexcms/core` import and
`TABLE_SLUG_SPEAKERS` to the `~/db/constants` import):

```ts
/**
 * Rejects a session whose `room`/`startsAt`/`durationMinutes` window overlaps
 * another session already booked into the same room.
 *
 * @param props.value - The `room` select's committed value (`string[]`, one element).
 * @param props.doc - The session document being saved — carries `startsAt`/`durationMinutes`.
 * @param props.vex - Cross-document, RBAC-aware query API.
 * @throws {VexError} `ROOM_CLASH` when another session in the same room overlaps in time.
 */
async function assertNoRoomClash(
  props: FieldValidateProps<typeof TABLE_SLUG_CONFERENCE_SESSIONS, string[]>,
): Promise<void> {
  // TODO: implement
  // 1. no `props.value[0]` → return (room not set yet)
  // 2. query same-room sessions → `props.vex.find({ collection: TABLE_SLUG_CONFERENCE_SESSIONS,
  //    withIndex: { name: "by_room", range: (q) => q.eq("room", props.value) } })`
  // 3. for each match where `_id !== props.doc._id`:
  //    a. compute both windows' `[startsAt, startsAt + durationMinutes * 60_000)`
  //    b. overlap test: `thisStart < otherEnd && otherStart < thisEnd`
  //    c. on overlap → throw `new VexError({ code: "ROOM_CLASH", message: … })` naming the
  //       conflicting session's title
  throw new Error("Not implemented")
}

/**
 * Keeps every referenced speaker's `sessionCount` equal to the number of
 * sessions that list them, after a session is created or its `speakers`
 * relationship changes.
 *
 * @param props.operation - `"create"` or `"update"`.
 * @param props.doc - The session document after the write.
 * @param props.ctx - Mutation ctx for the speakers patch.
 */
const syncSpeakerSessionCountsOnChange = afterChangeHook(TABLE_SLUG_CONFERENCE_SESSIONS, async (props) => {
  // TODO: implement
  // 1. a. `props.operation === "create"` → increment every id in `props.doc.speakers` by 1
  //    b. `props.operation === "update"` → diff `props.doc.speakers` against `props.oldDoc.speakers`:
  //       decrement ids removed, increment ids added
  // 2. per id: `props.ctx.db.get(id)` → `props.ctx.db.patch(id, { sessionCount: current.sessionCount
  //    + delta })`
  throw new Error("Not implemented")
})

/**
 * Decrements `sessionCount` for every speaker a deleted session referenced.
 *
 * @param props.oldDoc - The session document as it existed before the delete.
 * @param props.ctx - Mutation ctx for the speakers patch.
 */
const syncSpeakerSessionCountsOnDelete = afterDeleteHook(TABLE_SLUG_CONFERENCE_SESSIONS, async (props) => {
  // TODO: implement
  // 1. for every id in `props.oldDoc.speakers` → `props.ctx.db.get(id)` →
  //    `props.ctx.db.patch(id, { sessionCount: Math.max(0, current.sessionCount - 1) })`
  throw new Error("Not implemented")
})
```

2 — wire both into the collection and add `validate` to the `room` field, anchored on
`export const sessions = defineCollection({` (the `labels`/`admin` keys stay exactly as Step 18 left
them; `fields` stays `{}` with Step 18's numbered TODO, item 5 extended):

```ts
export const sessions = defineCollection({
  slug: TABLE_SLUG_CONFERENCE_SESSIONS,
  labels: {
    singular: "Session",
    plural: "Sessions",
  },
  admin: {
    useAsTitle: "title",
    icon: "CalendarClock",
    livePreview: {
      url: (doc) => `/sessions/${doc.slug}`,
    },
  },
  hooks: {
    afterChange: syncSpeakerSessionCountsOnChange,
    afterDelete: syncSpeakerSessionCountsOnDelete,
  },
  fields: {
    // … Step 18's 10-item TODO list; item 5 (`room`) gains `validate: assertNoRoomClash`
  },
})
```

#### src/vexcms/collections/speakers.ts

1 edit on top of Step 18's file. Everything else is unchanged.

1 — one hook function and the `hooks` key, anchored above/inside `export const speakers =
defineCollection({` (add `beforeDeleteHook, VexError` to the `@vexcms/core` import and
`TABLE_SLUG_CONFERENCE_SESSIONS` to the `~/db/constants` import):

```ts
/**
 * Rejects deleting a speaker that any session still lists in its `speakers`
 * relationship.
 *
 * @param props.id - The speaker id about to be deleted.
 * @param props.ctx - Mutation ctx for the cross-collection check.
 * @throws {VexError} `SPEAKER_HAS_SESSIONS` when at least one session still references this speaker.
 */
const rejectDeleteWithSessions = beforeDeleteHook(TABLE_SLUG_SPEAKERS, async (props) => {
  // TODO: implement
  // 1. list this speaker's sessions → `props.ctx.db.query(TABLE_SLUG_CONFERENCE_SESSIONS)
  //    .withIndex("by_speakers", (q) => q.eq("speakers", [props.id])).first()` — if the
  //    auto-generated `by_speakers` index does not support array-membership equality, fall back to
  //    `.collect()` + `.some((doc) => doc.speakers.includes(props.id))`
  // 2. a match found → throw `new VexError({ code: "SPEAKER_HAS_SESSIONS", message: … })` naming
  //    the referencing session's title
  throw new Error("Not implemented")
})
```

```ts
export const speakers = defineCollection({
  slug: TABLE_SLUG_SPEAKERS,
  labels: {
    singular: "Speaker",
    plural: "Speakers",
  },
  admin: {
    useAsTitle: "name",
    icon: "Mic",
    livePreview: {
      url: (doc) => `/speakers/${doc.slug}`,
    },
  },
  hooks: {
    beforeDelete: rejectDeleteWithSessions,
  },
  fields: {},
})
```

#### convex/auth/options.ts

One edit on the scaffolded file (`packages/create-vexcms/templates/base-nextjs/convex/auth/options.ts`)
— production sign-up lockdown (decision 21), same shape as the magazine/real-estate access steps: reads the
Convex env var the deploy step (Step 21) sets after the developer's own first sign-up, so Better
Auth rejects every later `/api/auth/sign-up/email` call without touching sign-in or the GitHub
OAuth path. Everything else in `emailAndPassword` (`enabled: true`, set by the scaffold installer)
is unchanged.

```ts
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.AUTH_DISABLE_SIGN_UP === "true",
  },
```

Verify: run-through rows "room/slot clash rejected", "speaker sessionCount follows create/delete",
"speaker with sessions cannot be deleted", "anonymous /admin read-only" pass; tag `conference/03-access`

---

### Step 20 — Conference 04–05: seed, front end, test kit [agent] — needs developer exception

Why: schedule and session pages with live preview; the exported test kit run against this config.

- [ ] `convex/seed.ts`
- [ ] `convex/sessions.ts`, `convex/speakers.ts`, `convex/eventSettings.ts`
- [ ] `src/app/api/vex/revalidate/route.ts`
- [ ] `src/app/sitemap.ts`
- [ ] `src/app/(frontend)/(site)/schedule/page.tsx`, `ScheduleContent.tsx`
- [ ] `src/app/(frontend)/(site)/sessions/[slug]/page.tsx`, `SessionContent.tsx`
- [ ] `src/app/(frontend)/(site)/speakers/[slug]/page.tsx`, `SpeakerContent.tsx`
- [ ] `src/app/layout.tsx` (Vercel Analytics)
- [ ] `package.json` — `@vercel/analytics`, `vitest`/testing-library devDependencies, `test` script
- [ ] `vitest.config.ts`
- [ ] `src/vexcms/admin.test.ts`
- [ ] `pnpm build`
- [ ] `pnpm test`
- [ ] `pnpm seed`, `pnpm seed:reinit`, `pnpm seed:reset`, `pnpm demo:accounts`
- [ ] `git tag conference/04-seed`, `git tag conference/05-front-end`

#### convex/seed.ts

The template ships one `init`-only `internalMutation` (insert-if-absent by natural key, no
patch/reset mode). This step converts it to the `init`/`reinit`/`reset` split over one
`runSeed(ctx, mode)`, exactly as Magazine Step 9 converts the same template for `magazine` — every
existing `ctx.db.query(...).first()` check there gains a `mode === "patch" ? ctx.db.patch(existing._id,
doc) : skipped.push(...)` branch instead of doing nothing on a match. That mechanical conversion of
the template's existing theme/header/footer/page blocks is not reproduced here; only the new
conference content and the mutation wrappers are shown in full.

1 — imports, anchored on the existing `~/db/constants` and `./_generated/server` import lines:

```ts
import {
  GLOBAL_SLUG_EVENT_SETTINGS,
  GLOBAL_SLUG_SITE_SETTINGS,
  TABLE_SLUG_CONFERENCE_SESSIONS,
  TABLE_SLUG_FOOTERS,
  TABLE_SLUG_HEADERS,
  TABLE_SLUG_PAGES,
  TABLE_SLUG_SPEAKERS,
  TABLE_SLUG_THEMES,
} from "~/db/constants"

import { internalMutation } from "./_generated/server"
import type { MutationCtx } from "./_generated/server"

type SeedMode = "insert" | "patch"

const SPEAKERS = [
  {
    name: "Ada Okafor",
    slug: "ada-okafor",
    bio: [{ type: "p", children: [{ text: "Ada leads the Convex integrations team and has shipped three realtime admin panels from scratch." }] }],
  },
  {
    name: "Marcus Chen",
    slug: "marcus-chen",
    bio: [{ type: "p", children: [{ text: "Marcus writes about realtime data and builds the admin tooling teams actually want to use." }] }],
  },
  {
    name: "Priya Natarajan",
    slug: "priya-natarajan",
    bio: [{ type: "p", children: [{ text: "Priya designs product-led growth loops for open-source developer tools." }] }],
  },
]

const SESSIONS = [
  {
    title: "Opening Keynote: The Next Decade of Convex",
    slug: "opening-keynote",
    abstract: "Where realtime backends are headed, and what that means for the apps you ship next year.",
    speakerSlugs: ["ada-okafor"],
    room: ["hall-a"],
    startsAt: Date.UTC(2026, 5, 10, 16, 0),
    durationMinutes: 45,
    track: ["engineering"],
    isKeynote: true,
    resources: {},
  },
  {
    title: "Building Realtime Admin Panels",
    slug: "realtime-admin-panels",
    abstract: "Patterns for admin UIs that update themselves — no polling, no stale state.",
    speakerSlugs: ["marcus-chen"],
    room: ["hall-b"],
    startsAt: Date.UTC(2026, 5, 10, 17, 0),
    durationMinutes: 40,
    track: ["engineering"],
    isKeynote: false,
    resources: {},
  },
  {
    title: "Designing for Product-Led Growth",
    slug: "product-led-growth",
    abstract: "Turning a free tier into a funnel, without turning the product into a nag screen.",
    speakerSlugs: ["priya-natarajan"],
    room: ["hall-a"],
    startsAt: Date.UTC(2026, 5, 10, 17, 0),
    durationMinutes: 40,
    track: ["product"],
    isKeynote: false,
    resources: {},
  },
  {
    title: "Panel: Scaling Open Source CMS",
    slug: "scaling-oss-panel",
    abstract: "Three maintainers on what breaks first when an open-source CMS gets its first thousand users.",
    speakerSlugs: ["ada-okafor", "marcus-chen", "priya-natarajan"],
    room: ["hall-b"],
    startsAt: Date.UTC(2026, 5, 10, 18, 0),
    durationMinutes: 50,
    track: ["product"],
    isKeynote: false,
    resources: {},
  },
]
```

2 — rename the existing `export const init = internalMutation({ args: {}, handler: async (ctx) => {
… } })` into a standalone `runSeed` function, adding `patched` beside the existing `created`/`skipped`
arrays (anchored on the existing `handler: async (ctx) => {` opening and the final `return { created,
skipped }`):

```ts
async function runSeed(ctx: MutationCtx, mode: SeedMode) {
  const created: string[] = []
  const patched: string[] = []
  const skipped: string[] = []

  // … Step 18's existing theme/header/footer/page blocks, each converted to the same
  // mode === "patch" ? ctx.db.patch(existing._id, doc) : skipped.push(...) shape — identical to
  // Magazine Step 9's conversion of this template, not reproduced here.

  const speakerIdBySlug = new Map<string, Id<typeof TABLE_SLUG_SPEAKERS>>()
  for (const speaker of SPEAKERS) {
    const existing = await ctx.db
      .query(TABLE_SLUG_SPEAKERS)
      .withIndex("by_slug", (q) => q.eq("slug", speaker.slug))
      .first()
    if (existing) {
      speakerIdBySlug.set(speaker.slug, existing._id)
      if (mode === "patch") {
        await ctx.db.patch(existing._id, { name: speaker.name, bio: speaker.bio })
        patched.push(`speaker:${speaker.slug}`)
      } else {
        skipped.push(`speaker:${speaker.slug}`)
      }
    } else {
      const id = await ctx.db.insert(TABLE_SLUG_SPEAKERS, {
        name: speaker.name,
        slug: speaker.slug,
        bio: speaker.bio,
        sessionCount: 0,
      })
      speakerIdBySlug.set(speaker.slug, id)
      created.push(`speaker:${speaker.slug}`)
    }
  }

  const sessionCountBySpeakerSlug = new Map<string, number>()
  for (const session of SESSIONS) {
    const speakerIds = session.speakerSlugs.map((slug) => {
      const id = speakerIdBySlug.get(slug)
      if (!id) throw new Error(`Seed order error: speaker "${slug}" not seeded yet`)
      sessionCountBySpeakerSlug.set(slug, (sessionCountBySpeakerSlug.get(slug) ?? 0) + 1)
      return id
    })
    const doc = {
      title: session.title,
      slug: session.slug,
      abstract: session.abstract,
      speakers: speakerIds,
      room: session.room,
      startsAt: session.startsAt,
      durationMinutes: session.durationMinutes,
      track: session.track,
      isKeynote: session.isKeynote,
      resources: session.resources,
    }
    const existing = await ctx.db
      .query(TABLE_SLUG_CONFERENCE_SESSIONS)
      .withIndex("by_slug", (q) => q.eq("slug", session.slug))
      .first()
    if (existing) {
      if (mode === "patch") {
        await ctx.db.patch(existing._id, doc)
        patched.push(`session:${session.slug}`)
      } else {
        skipped.push(`session:${session.slug}`)
      }
    } else {
      await ctx.db.insert(TABLE_SLUG_CONFERENCE_SESSIONS, doc)
      created.push(`session:${session.slug}`)
    }
  }

  for (const [slug, id] of speakerIdBySlug) {
    await ctx.db.patch(id, { sessionCount: sessionCountBySpeakerSlug.get(slug) ?? 0 })
  }

  const existingEventSettings = await getGlobal({ ctx, config, slug: GLOBAL_SLUG_EVENT_SETTINGS })
  if (!existingEventSettings || mode === "patch") {
    await upsertGlobal({
      ctx,
      config,
      slug: GLOBAL_SLUG_EVENT_SETTINGS,
      access: { bypass: true },
      data: {
        name: "VexConf 2026",
        dates: { startDate: Date.UTC(2026, 5, 10), endDate: Date.UTC(2026, 5, 11, 23, 59) },
        venue: {
          name: "Fog City Convention Center",
          address: "123 Market St, San Francisco, CA",
          mapUrl: "https://maps.google.com/?q=Fog+City+Convention+Center",
        },
      },
    })
    (existingEventSettings ? patched : created).push("global:eventSettings")
  } else {
    skipped.push("global:eventSettings")
  }

  return { created, patched, skipped }
}

export const init = internalMutation({
  args: {},
  handler: async (ctx) => runSeed(ctx, "insert"),
})

export const reinit = internalMutation({
  args: {},
  handler: async (ctx) => runSeed(ctx, "patch"),
})

export const reset = internalMutation({
  args: {},
  handler: async (ctx) => {
    const report = await runSeed(ctx, "patch")
    const seededSessionSlugs = new Set(SESSIONS.map((s) => s.slug))
    const seededSpeakerSlugs = new Set(SPEAKERS.map((s) => s.slug))
    const deleted: string[] = []
    for (const doc of await ctx.db.query(TABLE_SLUG_CONFERENCE_SESSIONS).collect()) {
      if (!seededSessionSlugs.has(doc.slug)) {
        await ctx.db.delete(doc._id)
        deleted.push(`session:${doc.slug}`)
      }
    }
    for (const doc of await ctx.db.query(TABLE_SLUG_SPEAKERS).collect()) {
      if (!seededSpeakerSlugs.has(doc.slug)) {
        await ctx.db.delete(doc._id)
        deleted.push(`speaker:${doc.slug}`)
      }
    }
    // … the same not-in-seed sweep over pages/headers/footers/themes, identical to Magazine
    // Step 9's `reset`, not reproduced here.
    return { ...report, deleted }
  },
})
```

`reset` deletes raw `ctx.db` rows rather than going through the `sessions`/`speakers` Local API
`remove`, so the `afterChange`/`afterDelete`/`beforeDelete` hooks from Step 19 never fire for seed
data — `sessionCount` is instead recomputed directly from `SESSIONS` every `runSeed` pass, and no
seeded speaker is ever referenced only by a non-seeded session, so the delete-guard hook never blocks
`reset`.

#### convex/sessions.ts

New file, mirrors `convex/pages.ts`'s `getBySlug`/`publishedSlugs` shape. `sessions` carries no
`versions.drafts`, so there is no preview-query counterpart to write.

```ts
import { v } from "convex/values"

import { TABLE_SLUG_CONFERENCE_SESSIONS } from "~/db/constants"
import { find } from "~/vexcms/api"

import { query } from "./_generated/server"

/**
 * Returns the session document matching `slug`, or an empty array.
 *
 * Access is bypassed: read by anonymous visitors on `/sessions/[slug]` and at build time.
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await find({
      ctx,
      collection: TABLE_SLUG_CONFERENCE_SESSIONS,
      withIndex: {
        name: "by_slug",
        range: (q) => q.eq("slug", slug),
      },
      limit: 1,
      access: { bypass: true },
    })
  },
})

/**
 * Returns every session document.
 *
 * Consumed by `/schedule`, `ScheduleEmbedBlock`, `app/sitemap.ts` and
 * `/speakers/[slug]` (filtered client-side on the resolved speaker id).
 */
export const all = query({
  args: {},
  handler: async (ctx) => {
    return await find({
      ctx,
      collection: TABLE_SLUG_CONFERENCE_SESSIONS,
      access: { bypass: true },
    })
  },
})
```

#### convex/speakers.ts

New file, same shape.

```ts
import { v } from "convex/values"

import { TABLE_SLUG_SPEAKERS } from "~/db/constants"
import { find } from "~/vexcms/api"

import { query } from "./_generated/server"

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await find({
      ctx,
      collection: TABLE_SLUG_SPEAKERS,
      withIndex: {
        name: "by_slug",
        range: (q) => q.eq("slug", slug),
      },
      limit: 1,
      access: { bypass: true },
    })
  },
})

export const all = query({
  args: {},
  handler: async (ctx) => {
    return await find({
      ctx,
      collection: TABLE_SLUG_SPEAKERS,
      access: { bypass: true },
    })
  },
})
```

#### convex/eventSettings.ts

New file. `eventSettings` is a global, so this wraps `globals.get` (the `~/vexcms/api` binding's
global counterpart to `find`) instead of a collection query.

```ts
import { GLOBAL_SLUG_EVENT_SETTINGS } from "~/db/constants"
import { globals } from "~/vexcms/api"

import { query } from "./_generated/server"

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await globals.get({ ctx, slug: GLOBAL_SLUG_EVENT_SETTINGS, access: { bypass: true } })
  },
})
```

#### src/app/api/vex/revalidate/route.ts

1 edit — `listCollection` gains `sessions`/`speakers` branches, anchored on the existing `if
(collection !== "pages") return []` body (the `createVexRevalidateRoute({...})` call's other options
are unchanged):

```ts
  listCollection: async (collection) => {
    if (collection === "pages") {
      const entries = await vex.query(api.pages.publishedSlugs, {})
      return entries.map(({ slug }) => ({ slug }))
    }
    if (collection === "sessions") {
      const entries = await vex.query(api.sessions.all, {})
      return entries.map(({ slug }) => ({ slug }))
    }
    if (collection === "speakers") {
      const entries = await vex.query(api.speakers.all, {})
      return entries.map(({ slug }) => ({ slug }))
    }
    return []
  },
```

#### src/app/sitemap.ts

Replace the single `createVexSitemap({...})` export with three merged sitemaps — `createVexSitemap`
returns a Next `MetadataRoute.Sitemap`-producing function, not the array itself, so the three calls
are invoked and concatenated:

```ts
import { api } from "@convex/_generated/api"
import { createVexSitemap } from "@vexcms/next/seo"

import { env } from "~/env.mjs"
import { vex } from "~/lib/vex"

const pagesSitemap = createVexSitemap({
  client: vex,
  query: api.pages.publishedSlugs,
  toUrl: (slug) => (slug === "home" ? env.NEXT_PUBLIC_SITE_URL : `${env.NEXT_PUBLIC_SITE_URL}/${slug}`),
  getSlug: (item) => item.slug,
})

const sessionsSitemap = createVexSitemap({
  client: vex,
  query: api.sessions.all,
  toUrl: (slug) => `${env.NEXT_PUBLIC_SITE_URL}/sessions/${slug}`,
  getSlug: (item) => item.slug,
})

const speakersSitemap = createVexSitemap({
  client: vex,
  query: api.speakers.all,
  toUrl: (slug) => `${env.NEXT_PUBLIC_SITE_URL}/speakers/${slug}`,
  getSlug: (item) => item.slug,
})

export default async function sitemap() {
  const [pages, sessions, speakers] = await Promise.all([pagesSitemap(), sessionsSitemap(), speakersSitemap()])
  return [...pages, ...sessions, ...speakers]
}
```

#### src/app/(frontend)/(site)/schedule/page.tsx

New file.

```tsx
import { api } from "@convex/_generated/api"

import { vex } from "~/lib/vex"

import { ScheduleContent } from "./ScheduleContent"

export const revalidate = 3600

export async function generateMetadata() {
  const eventSettings = await vex.query(api.eventSettings.get, {})
  return { title: eventSettings ? `Schedule — ${eventSettings.name}` : "Schedule" }
}

export default async function SchedulePage() {
  const [sessions, eventSettings] = await Promise.all([
    vex.query(api.sessions.all, {}),
    vex.query(api.eventSettings.get, {}),
  ])
  return <ScheduleContent initialSessions={sessions} initialEventSettings={eventSettings} />
}
```

#### src/app/(frontend)/(site)/schedule/ScheduleContent.tsx

New file. `eventSettings` is live-preview aware (`useLivePreviewQuery`); `sessions` is a plain
subscription — Step 19 did not add live preview to `sessions`' own detail is handled on
`/sessions/[slug]` instead, so the list here stays a simple query.

```tsx
"use client"

import { convexQuery, useQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { useLivePreviewQuery } from "@vexcms/react"
import Link from "next/link"

import type { EventSettingsDocument, SessionsDocument } from "~/vex.types"

import { Container } from "~/components/Container"

export interface ScheduleContentProps {
  initialSessions: SessionsDocument[]
  initialEventSettings: EventSettingsDocument | null
}

export function ScheduleContent({ initialSessions, initialEventSettings }: ScheduleContentProps) {
  const { data: eventSettings } = useLivePreviewQuery(
    { ...convexQuery(api.eventSettings.get, {}), initialData: initialEventSettings },
    "eventSettings",
  )
  const { data: sessions } = useQuery({
    ...convexQuery(api.sessions.all, {}),
    initialData: initialSessions,
  })

  const sorted = [...(sessions ?? [])].sort((a, b) => a.startsAt - b.startsAt)

  return (
    <Container className="py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{eventSettings?.name ?? "Schedule"}</h1>
      {eventSettings?.venue.name ? (
        <p className="text-muted-foreground mt-2">{eventSettings.venue.name}</p>
      ) : null}
      <ol className="mt-8 flex flex-col gap-4">
        {sorted.map((session) => (
          <li key={session._id} className="border-border rounded-lg border p-4">
            <Link className="font-medium" href={`/sessions/${session.slug}`}>
              {session.title}
            </Link>
            <p className="text-muted-foreground text-sm">
              {new Date(session.startsAt).toLocaleTimeString()} · {session.room[0]}
            </p>
          </li>
        ))}
      </ol>
    </Container>
  )
}
```

#### src/app/(frontend)/(site)/sessions/[slug]/page.tsx

New file.

```tsx
import type { Metadata } from "next"

import { api } from "@convex/_generated/api"
import { notFound } from "next/navigation"

import { vex } from "~/lib/vex"

import { SessionContent } from "./SessionContent"

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const [session] = await vex.query(api.sessions.getBySlug, { slug })
  return { title: session?.title ?? "Session" }
}

export default async function SessionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const initialData = await vex.query(api.sessions.getBySlug, { slug })
  if (initialData.length === 0) notFound()
  return <SessionContent initialData={initialData} slug={slug} />
}
```

#### src/app/(frontend)/(site)/sessions/[slug]/SessionContent.tsx

New file. `sessions` is not versioned, so — unlike `PostContent`/`PageContent` — there is no
published/preview query split: `useLivePreviewQuery` overlays unsaved edits directly on the single
`getBySlug` query.

```tsx
"use client"

import { convexQuery, useQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { keepPreviousData } from "@tanstack/react-query"
import { useLivePreviewQuery } from "@vexcms/react"

import type { SessionsDocument, SpeakersDocument } from "~/vex.types"

import { Container } from "~/components/Container"

import { NotFoundContent } from "../../NotFoundContent"

export interface SessionContentProps {
  initialData: SessionsDocument[]
  slug: string
}

export function SessionContent({ initialData, slug }: SessionContentProps) {
  const { data: matches } = useLivePreviewQuery(
    {
      ...convexQuery(api.sessions.getBySlug, { slug }),
      initialData,
      placeholderData: keepPreviousData,
    },
    "sessions",
  )
  const session = matches?.[0]

  const { data: speakers } = useQuery({ ...convexQuery(api.speakers.all, {}) })
  const sessionSpeakers = (speakers ?? []).filter((speaker: SpeakersDocument) =>
    (session?.speakers ?? []).includes(speaker._id),
  )

  if (!session) return <NotFoundContent />

  return (
    <Container className="py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{session.title}</h1>
      <p className="text-muted-foreground mt-2">
        {new Date(session.startsAt).toLocaleString()} · {session.room[0]} · {session.track[0]}
      </p>
      <p className="mt-6 max-w-[46rem]">{session.abstract}</p>
      {sessionSpeakers.length > 0 ? (
        <ul className="mt-6 flex flex-wrap gap-4">
          {sessionSpeakers.map((speaker: SpeakersDocument) => (
            <li key={speaker._id}>
              <a className="font-medium" href={`/speakers/${speaker.slug}`}>
                {speaker.name}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </Container>
  )
}
```

#### src/app/(frontend)/(site)/speakers/[slug]/page.tsx

New file.

```tsx
import type { Metadata } from "next"

import { api } from "@convex/_generated/api"
import { notFound } from "next/navigation"

import { vex } from "~/lib/vex"

import { SpeakerContent } from "./SpeakerContent"

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const [speaker] = await vex.query(api.speakers.getBySlug, { slug })
  return { title: speaker?.name ?? "Speaker" }
}

export default async function SpeakerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const initialData = await vex.query(api.speakers.getBySlug, { slug })
  if (initialData.length === 0) notFound()
  return <SpeakerContent initialData={initialData} slug={slug} />
}
```

#### src/app/(frontend)/(site)/speakers/[slug]/SpeakerContent.tsx

New file.

```tsx
"use client"

import { convexQuery, useQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { keepPreviousData } from "@tanstack/react-query"
import { useLivePreviewQuery } from "@vexcms/react"
import { RichText } from "@vexcms/richtext-plate/render"

import type { SessionsDocument } from "~/vex.types"

import { Container } from "~/components/Container"

import { NotFoundContent } from "../../NotFoundContent"

export interface SpeakerContentProps {
  initialData: unknown[]
  slug: string
}

export function SpeakerContent({ initialData, slug }: SpeakerContentProps) {
  const { data: matches } = useLivePreviewQuery(
    {
      ...convexQuery(api.speakers.getBySlug, { slug }),
      initialData,
      placeholderData: keepPreviousData,
    },
    "speakers",
  )
  const speaker = matches?.[0]

  const { data: sessions } = useQuery({ ...convexQuery(api.sessions.all, {}) })
  const speakerSessions = (sessions ?? []).filter((session: SessionsDocument) =>
    speaker ? session.speakers.includes(speaker._id) : false,
  )

  if (!speaker) return <NotFoundContent />

  return (
    <Container className="py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{speaker.name}</h1>
      <RichText className="prose mt-8 max-w-[46rem]" content={speaker.bio ?? []} />
      {speakerSessions.length > 0 ? (
        <ul className="mt-8 flex flex-col gap-2">
          {speakerSessions.map((session: SessionsDocument) => (
            <li key={session._id}>
              <a className="font-medium" href={`/sessions/${session.slug}`}>
                {session.title}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </Container>
  )
}
```

#### src/app/layout.tsx

1 edit — mount Vercel Analytics, anchored on the existing `</body>` close (everything above inside
`<body>` — `ServerProviders`/`ClientProviders`/`LivePreviewProvider` — is unchanged):

```tsx
import { Analytics } from "@vercel/analytics/next"
```

```tsx
          </ClientProviders>
        </ServerProviders>
        <Analytics />
      </body>
```

#### package.json

3 edits.

1 — `dependencies`, anchored alongside the existing `@vexcms/*`/`next`/`react` entries:

```json
    "@vercel/analytics": "2.0.0",
```

2 — `devDependencies`, anchored alongside `typescript`/`eslint`:

```json
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.3",
    "@testing-library/user-event": "14.6.8",
    "jsdom": "26.1.0",
    "vitest": "4.1.12",
    "vitest-axe": "1.0.0-pre.5",
```

3 — `scripts`, anchored on the existing `"seed": "convex run seed:init",`:

```json
    "seed": "convex run seed:init",
    "seed:reinit": "convex run seed:reinit",
    "seed:reset": "convex run seed:reset",
    "demo:accounts": "node scripts/create-demo-accounts.mjs",
    "test": "vitest run",
```

#### vitest.config.ts

New file. A real published package, not a symlinked workspace dependency, so `setupFiles:
["@vexcms/react/testing"]` resolves directly — no indirection file is needed the way `apps/test`'s
symlinked workspace copy does.

```ts
import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    pool: "threads",
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "convex/**/*.test.ts"],
    passWithNoTests: true,
    setupFiles: ["@vexcms/react/testing"],
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
      "@convex": fileURLToPath(new URL("./convex", import.meta.url)),
    },
  },
})
```

#### src/vexcms/admin.test.ts

New file. Mirrors `apps/www/src/vexcms/admin.test.ts`'s smoke pattern: the fast `"shell"` section
against this project's real `access`, plus one `custom` fixture proving a project-authored field
(`sessions.isKeynote`) runs through the same `runFieldInputContractSuite` machinery every core field
type runs through.

```ts
import { checkbox, type CheckboxField } from "@vexcms/react"
import { CheckboxFieldAdmin } from "@vexcms/react/admin"
import { runVexReactSuite, type FieldFixture } from "@vexcms/react/testing"

import { access } from "~/auth/access"

const isKeynoteFixture: FieldFixture<CheckboxField, boolean> = {
  fieldType: "checkbox",
  fieldDef: checkbox({ label: "Keynote" }),
  valid: true,
  invalid: undefined,
  empty: false,
}

runVexReactSuite({
  sections: ["shell"],
  access,
  custom: [{ ...isKeynoteFixture, Component: CheckboxFieldAdmin }],
})
```

Verify: `pnpm build` 0; `pnpm test` runs the kit suite green; seed/reinit/reset/accounts pass; tags
`conference/04-seed`, `conference/05-front-end`

---

### Step 21 — Conference 06: deploy, playbook, run-through [agent] — needs developer exception

Waits for: human — conference Convex prod + Vercel project + env set up (`CONVEX_DEPLOY_KEY`
Production-scoped, Vercel build command `pnpm vex:deploy --cmd 'pnpm build'`, prod
`GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` on Convex prod, a second GitHub OAuth callback for
production, first sign-up done by the developer so that account becomes admin).
Why: the developer owns the production deploy himself (decision 6); the agent verifies it, closes sign-up,
and records it, same pattern as magazine's Step 11.

- [ ] check the production build log: `vex deploy --cmd 'pnpm build'` ran exactly once, on the final
      push, and the Next.js build it triggered succeeded (Step 3's `vex deploy` flag-passthrough fix)
- [ ] `npx convex run seed:init --prod` (3 speakers + 4 sessions + event settings)
- [ ] verify the prod URL returns 200 with the seeded schedule, `/admin` sign-in works with the
      developer's own account, and GitHub sign-in reaches prod `/admin` via the production callback
- [ ] sign-up lockdown (decision 21): confirm the developer already signed up first → run
      `pnpm demo:accounts` against the prod URL → `npx convex env set AUTH_DISABLE_SIGN_UP true --prod`;
      verify `POST /api/auth/sign-up/email` on prod now returns an error status, and signing in with
      the demo admin account still works
- [ ] `conference/README.md` — add the "Live demo" line (site URL, `/admin`)
- [ ] fix `guides/deployment.mdx` for any deviation from what the production build log actually shows
- [ ] `.agent/docs/specs/2026-11-09-golden-use-cases/playbooks/conference.md`
- [ ] `.agent/docs/specs/2026-11-09-golden-use-cases/golden-runthrough.md` § conference
- [ ] `git tag conference/06-deployed`

Deviation from the magazine/real-estate deploy beats this step otherwise mirrors: GitHub OAuth is
per-environment (Better Auth's callback URL is origin-scoped), so production needs a second
callback registered — either a second GitHub OAuth App for prod, or an extra callback URL added to the
dev app, either way with its own `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` pair if a second app is
used; the developer sets these as part of this step's `Waits for`. `guides/deployment.mdx` (Step 3/4
of this spec) does not cover OAuth callbacks — note the gap there if this step hits it for the first
time among the four scenarios.

#### .agent/docs/specs/2026-11-09-golden-use-cases/playbooks/conference.md

New file.

````markdown
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
````

#### .agent/docs/specs/2026-11-09-golden-use-cases/golden-runthrough.md

`## conference` section, anchored after `## magazine`/`## real-estate` (whichever already lands
there) — this writer does not touch those sections.

````markdown
## conference

Run against a fresh `pnpm create vexcms@alpha conference` scaffold on the published
`@vexcms/*@0.1.0-alpha.35`, port 3220, Convex project `vex-example-conference`, following the same
interactive-answers convention as `n-runthrough.md`.

| | conference |
|---|---|
| Folder | `~/Documents/Projects/vexcms-examples/conference` |
| Answers | name `conference`, marketing-site (no `--bare`), port **3220**, email/password yes, orgs no, OAuth → GitHub, git yes, install yes |
| Convex project | `vex-example-conference` |
| Env | `.env.local` `BETTER_AUTH_SECRET`/`GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` from the scaffold + the dev GitHub OAuth App; `SITE_URL` + `BETTER_AUTH_SECRET` + the two GitHub vars set on the deployment |

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Scaffold | `pnpm create vexcms@alpha conference` | Install, lint, format succeed; GitHub answered at prompt 6/8 | pending |
| `vex dev` generates | `pnpm vex:dev` | `convex/vex.schema.ts`/`src/vex.types.ts` carry `Speaker`/`Session`/`EventSettings` | pending |
| `pnpm typecheck` | — | exits 0 | pending |
| Admin shows new resources | `/admin` sidebar | Speakers, Sessions, Event settings present | pending |
| GitHub sign-in reaches `/admin` | sign out, "Continue with GitHub" | redirected to `/admin` | pending |
| Room/slot clash rejected | admin → Sessions → new session, same room + overlapping time as a seeded one | save rejected, `ROOM_CLASH` message shown | pending |
| Speaker `sessionCount` follows create/delete | create a session referencing a speaker, note their `sessionCount`; delete it | increments then decrements by 1 | pending |
| Speaker with sessions cannot be deleted | admin → Speakers → delete a speaker with ≥ 1 session | delete rejected, `SPEAKER_HAS_SESSIONS` message shown | pending |
| Anonymous `/admin` read-only | private tab, visit `/admin` signed out | Speakers/Sessions/Event settings visible read-only, no "+ New", every write control absent | pending |
| `pnpm build` | — | exits 0; `/`, `/schedule`, `/sessions/[slug]`, `/speakers/[slug]` prerendered | pending |
| `pnpm test` | — | kit suite green (`runVexReactSuite` shell section + the `isKeynote` custom fixture) | pending |
| Seed / reinit / reset / accounts | `pnpm seed`, `pnpm seed:reinit`, `pnpm seed:reset`, `pnpm demo:accounts` | seeded docs created; reinit patches an edited row back; reset removes a take-created session and restores the seeded dates/venue; one admin account created with the right role | pending |
| `eventSettings` live preview | admin → Event Settings, edit `dates.startDate`, `/schedule` open in a second tab | countdown/header update without a save | pending |
| Blocks clipboard | admin → a page's blocks field, copy the `ScheduleEmbed` block, paste onto a second page | pasted block carries the same field values, unknown keys dropped | pending |
| Deploy | human sets up Convex prod + Vercel project + env, triggers the build | production build log shows `vex deploy --cmd 'pnpm build'` ran once; prod URL 200 with seeded schedule | pending |
| Prod seed + accounts | `npx convex run seed:init --prod`, `pnpm demo:accounts` against the prod URL | 3 speakers + 4 sessions + event settings created; one admin account created | pending |
| GitHub sign-in on prod | prod URL, "Continue with GitHub" | redirected to prod `/admin` | pending |
| Sign-up lockdown | `npx convex env set AUTH_DISABLE_SIGN_UP true --prod` | `POST /api/auth/sign-up/email` on prod returns an error status; sign-in with the demo admin account still works | pending |
| `conference-schedule-live-preview.mp4` | shot list | plays, ≤ 60s, ≤ 10MB, no audio track | pending |
| `conference-room-clash.mp4` | shot list | plays, ≤ 60s, ≤ 10MB, no audio track | pending |
| `conference-anon-admin.mp4` | shot list | plays, ≤ 60s, ≤ 10MB, no audio track | pending |
| `conference-github-signin.mp4` | shot list | plays, ≤ 60s, ≤ 10MB, no audio track | pending |
````

Verify: prod URL 200; GitHub sign-in on prod; `golden-runthrough.md` § conference all `pass`; tag
`conference/06-deployed`

### Step 22 — Restaurant 01–02: scaffold, collections, hours global, brand themes [dev] — needs developer exception

Why: the D2 alternate — menus as arrays of groups, brand themes, a global whose preview updates the banner live.
Waits for: GU-12.

- [ ] `pnpm create vexcms@alpha restaurant` scaffold, port 3230, Convex project `vex-example-restaurant`
- [ ] `restaurant/src/db/constants/index.ts` — `TABLE_SLUG_LOCATIONS`, `TABLE_SLUG_MENUS`, `GLOBAL_SLUG_HOURS`
- [ ] `restaurant/src/vexcms/collections/locations.ts`
- [ ] `restaurant/src/vexcms/collections/menus.ts`
- [ ] `restaurant/src/vexcms/collections/index.ts` — barrel edit
- [ ] `restaurant/src/vexcms/globals/hours.ts`
- [ ] `restaurant/src/vexcms/globals/index.ts` — barrel edit
- [ ] `restaurant/src/vex.config.ts` — register `locations`, `menus`, `hours`
- [ ] tags `restaurant/01-scaffold`, `restaurant/02-collections` pushed

**Scaffold command**

Inside the Step 14 P-024 exception scope (`~/Documents/Projects/vexcms-examples`, Design Decision 14).
No `--bare` — restaurant uses the **marketing-site** template (F55), the same default
`pnpm create vexcms@alpha` resolves to (`apps/docs/src/content/docs/guides/quickstart.mdx`: "By
default this includes the full marketing-site starter"). The CLI's 8 prompts, answered live for
the 15-minute script, typed-not-defaulted (Design Decision 3/Listed exceptions — `--yes` stays
unused):

```bash
cd ~/Documents/Projects/vexcms-examples
pnpm create vexcms@alpha restaurant
# name: restaurant
# framework: Next.js
# dev server port: 3230
# email/password auth: yes
# organizations: no
# OAuth providers: none
# git init: yes
# install dependencies: yes
cd restaurant
npx convex dev --once
# Convex project: vex-example-restaurant (dev deployment)
npx convex env set SITE_URL http://localhost:3230
npx convex env set BETTER_AUTH_SECRET <the BETTER_AUTH_SECRET value from .env.local>
git tag restaurant/01-scaffold
git push && git push --tags
```

`npx convex dev --once` writes the real `NEXT_PUBLIC_CONVEX_URL`/`NEXT_PUBLIC_CONVEX_SITE_URL` into
`.env.local`, replacing the scaffolded placeholders (`apps/docs/.../quickstart.mdx`). The two
`convex env set` calls are what the same guide flags as "the most common cause of a `403` on your
first sign-in attempt" when skipped.

#### restaurant/src/db/constants/index.ts

Numbered edit on the scaffolded file (`packages/create-vexcms/templates/base-nextjs/src/db/constants/index.ts`,
shared by both templates — the marketing-site overlay does not touch `src/db`). Everything not
shown is unchanged.

**1 — new table/global slugs.** Appended after the existing `GLOBAL_SLUG_SITE_SETTINGS` line:

```ts
export const TABLE_SLUG_LOCATIONS = "locations" as const
export const TABLE_SLUG_MENUS = "menus" as const
export const GLOBAL_SLUG_HOURS = "hours" as const
```

#### restaurant/src/vexcms/collections/locations.ts

New file. Guided stub (Design Decision 10 — `[dev]`): the `defineCollection` skeleton compiles
and typechecks — every field below is called with the minimum options required to satisfy its own
factory signature (`group()`/`relationship()`/`upload()` all require a sub-property), so `admin.useAsTitle`
and `admin.livePreview.url`'s `doc.slug` access resolve against a real field. The numbered `// TODO:`
comments are what the developer fills in on camera.

```ts
import { defineCollection, group, relationship, text, upload } from "@vexcms/core"

import { TABLE_SLUG_LOCATIONS } from "~/db/constants"

/**
 * One restaurant location. `brandTheme` picks this location's palette from
 * the `themes` collection every marketing-site scaffold already ships
 * (`packages/create-vexcms/templates/marketing-site/src/vexcms/collections/themes.ts`) —
 * no new themes collection needed, just a relationship onto it. Rendered
 * with `buildThemeCss` on `/locations/[slug]`.
 */
export const locations = defineCollection({
  slug: TABLE_SLUG_LOCATIONS,
  interfaceName: "Location",
  labels: { singular: "Location", plural: "Locations" },
  admin: {
    useAsTitle: "name",
    icon: "MapPin",
    livePreview: {
      url: (doc) => `/locations/${doc.slug}`,
    },
  },
  fields: {
    // TODO: 1. name — text({ label: "Name", required: true })
    name: text(),
    // TODO: 2. slug — text({ label: "Slug", required: true, index: "by_slug",
    //    description: "URL-friendly location path, e.g. \"downtown\"." })
    slug: text(),
    // TODO: 3. address — group({ label: "Address", fields: {
    //      street: text({ label: "Street", required: true }),
    //      city:   text({ label: "City", required: true }),
    //      state:  text({ label: "State", required: true }),
    //      zip:    text({ label: "ZIP", required: true }),
    //    } })
    address: group({ fields: {} }),
    // TODO: 4. phone — text({ label: "Phone", admin: { mask: "(999) 999-9999" } })
    //    (admin.mask — Input Masks guide, use-mask-input "(999) 999-9999" literal form)
    phone: text(),
    // TODO: 5. brandTheme — relationship({ label: "Brand Theme",
    //      collection: { slug: TABLE_SLUG_THEMES }, hasMany: false })
    //    import TABLE_SLUG_THEMES from "~/db/constants" alongside TABLE_SLUG_LOCATIONS
    brandTheme: relationship({ collection: { slug: TABLE_SLUG_LOCATIONS } }),
    // TODO: 6. photo — upload({ label: "Photo", to: TABLE_SLUG_IMAGES })
    //    import TABLE_SLUG_IMAGES from "~/db/constants"
    photo: upload({ to: TABLE_SLUG_LOCATIONS }),
  },
})
```

The `brandTheme`/`photo` stub lines above point `collection`/`to` at `TABLE_SLUG_LOCATIONS` only to
satisfy each factory's required property while the real target constants (`TABLE_SLUG_THEMES`,
`TABLE_SLUG_IMAGES`) are still TODOs, not imported yet — the developer's pass swaps both at once.

#### restaurant/src/vexcms/collections/menus.ts

New file. Guided stub, same shape. `sections` is the array-of-groups-of-array-of-groups shape
the conditional-fields-and-masks guide's own `Sections`/`items: group()` example and
`apps/test/src/vexcms/collections/pages.ts:210-225`'s nested "sub group array list" both use —
array(group) nests inside array(group) without restriction.

```ts
import { array, checkbox, date, defineCollection, group, number, relationship, select, text, textarea } from "@vexcms/core"

import { TABLE_SLUG_MENUS } from "~/db/constants"

/**
 * One seasonal menu for one location. `versions.drafts: true` is what makes
 * "duplicate this menu for next season" (the edit-actions-menu
 * built-in, F29) safe — the duplicate starts as an unpublished draft the
 * developer edits and publishes once the season turns, never touching the
 * currently-live menu.
 */
export const menus = defineCollection({
  slug: TABLE_SLUG_MENUS,
  interfaceName: "Menu",
  labels: { singular: "Menu", plural: "Menus" },
  admin: {
    useAsTitle: "title",
    icon: "UtensilsCrossed",
  },
  versions: {
    drafts: true,
  },
  fields: {
    // TODO: 1. title — text({ label: "Title", required: true })
    title: text(),
    // TODO: 2. location — relationship({ label: "Location",
    //      collection: { slug: TABLE_SLUG_LOCATIONS }, required: true, hasMany: false })
    //    import TABLE_SLUG_LOCATIONS from "~/db/constants" alongside TABLE_SLUG_MENUS
    location: relationship({ collection: { slug: TABLE_SLUG_MENUS } }),
    // TODO: 3. season — select({ label: "Season", required: true, hasMany: false, options: [
    //      { label: "Spring", value: "spring" }, { label: "Summer", value: "summer" },
    //      { label: "Fall", value: "fall" }, { label: "Winter", value: "winter" },
    //      { label: "Year-Round", value: "year-round" },
    //    ] })
    season: select(),
    // TODO: 4. seasonalUntil — date({ label: "Seasonal Until", admin: {
    //      condition: ({ siblingData }) =>
    //        typeof siblingData === "object" && siblingData !== null &&
    //        "season" in siblingData && siblingData.season !== "year-round",
    //    }, description: "Hidden when Season is Year-Round (Conditional Fields guide)." })
    seasonalUntil: date(),
    // TODO: 5. sections — array({ label: "Sections", items: group({ label: "Section", fields: {
    //      title: text({ label: "Title", required: true }),
    //      items: array({ label: "Items", items: group({ label: "Item", fields: {
    //        name: text({ label: "Name", required: true }),
    //        description: textarea({ label: "Description" }),
    //        price: number({ label: "Price", required: true, admin: {
    //          mask: { mask: "decimal", storeMasked: false, options: { radixPoint: "." } },
    //        } }), — Input override wired in Step 23 (restaurant/03-access), see PriceInput.tsx
    //        dietary: select({ label: "Dietary", hasMany: true, options: [
    //          { label: "Vegetarian", value: "vegetarian" }, { label: "Vegan", value: "vegan" },
    //          { label: "Gluten-Free", value: "gluten-free" }, { label: "Dairy-Free", value: "dairy-free" },
    //          { label: "Spicy", value: "spicy" },
    //        ] }),
    //        isAvailable: checkbox({ label: "Available", defaultValue: true }),
    //      } }) }),
    //    } }) })
    sections: array({
      items: group({
        fields: {
          title: text(),
          items: array({ items: group({ fields: { name: text(), description: textarea(), price: number(), dietary: select(), isAvailable: checkbox() } }) }),
        },
      }),
    }),
  },
})
```

#### restaurant/src/vexcms/collections/index.ts

Numbered edit (barrel, same shape as `pages`/`headers`/`themes`). Everything not shown is unchanged.

**1 — new exports**, alphabetical beside the existing ones:

```ts
export * from "./locations"
export * from "./menus"
```

#### restaurant/src/vexcms/globals/hours.ts

New file. Guided stub. `admin.livePreview.url: "/"` is the literal-path form (live-preview guide:
"a site header rendered on every page is `url: "/"`") — it needs no field access, so it is safe to
write for real even though `fields` below is still the compiling stub.

```ts
import { array, color, defineGlobal, group, select, text } from "@vexcms/core"

import { GLOBAL_SLUG_HOURS } from "~/db/constants"

/**
 * Weekly hours plus the site-wide banner. The banner (`bannerText`/
 * `bannerColor`) is this scenario's "global whose preview updates the
 * banner live" — edited here, rendered by
 * `HoursBanner`/`HoursBannerContent` on every public route.
 */
export const hours = defineGlobal({
  slug: GLOBAL_SLUG_HOURS,
  label: "Hours & Banner",
  admin: {
    icon: "Clock",
    livePreview: {
      url: "/",
    },
  },
  fields: {
    // TODO: 1. weekly — array({ label: "Weekly Hours", min: 7, max: 7, items: group({ label: "Day", fields: {
    //      day: select({ label: "Day", required: true, hasMany: false, options: [
    //        { label: "Monday", value: "monday" }, { label: "Tuesday", value: "tuesday" },
    //        { label: "Wednesday", value: "wednesday" }, { label: "Thursday", value: "thursday" },
    //        { label: "Friday", value: "friday" }, { label: "Saturday", value: "saturday" },
    //        { label: "Sunday", value: "sunday" },
    //      ] }),
    //      opens: text({ label: "Opens", admin: { mask: "99:99 AM" } }),
    //      closes: text({ label: "Closes", admin: { mask: "99:99 PM" } }),
    //    } }) })
    weekly: array({ items: group({ fields: {} }) }),
    // TODO: 2. bannerText — text({ label: "Banner Text",
    //      description: "Shown site-wide. Leave empty to hide the banner." })
    bannerText: text(),
    // TODO: 3. bannerColor — color({ label: "Banner Color", defaultValue: "#b45309" })
    bannerColor: color(),
  },
})
```

#### restaurant/src/vexcms/globals/index.ts

Numbered edit. Everything not shown is unchanged.

**1 — new export**, after the existing `siteSettings` line:

```ts
export * from "./hours"
```

#### restaurant/src/vex.config.ts

Numbered edit on the scaffolded `vex.config.ts` (marketing-site overlay). Everything not shown is
unchanged.

**1 — imports.** `locations`/`menus` added to the existing `~/vexcms/collections` import,
`hours` added to the existing `~/vexcms/globals` import:

```ts
import { footers, headers, images, locations, menus, pages, themes, users } from "~/vexcms/collections"
import { hours, siteSettings } from "~/vexcms/globals"
```

**2 — `collections`/`globals` arrays.**

```ts
  collections: [users, pages, headers, footers, themes, locations, menus],
  mediaCollections: [images],
  globals: [siteSettings, hours],
```

Verify: `pnpm typecheck` 0; `vex dev` regenerates `convex/vex.schema.ts` + `src/vex.types.ts` with
`Location`/`Menu` (`locations`/`menus` tables) and `HoursGlobal`; admin sidebar shows Locations,
Menus, Hours & Banner; tags `restaurant/01-scaffold`, `restaurant/02-collections` pushed

---

### Step 23 — Restaurant 03: access, Input override, duplicate [dev] — needs developer exception

Why: the admin-customization story: a price `Input` override with a live formatted preview;
duplicate a menu for a new season.

- [ ] `restaurant/src/db/constants/auth.ts` — `staff` role
- [ ] `restaurant/src/auth/access.ts` — `staff` role, `locations`/`menus`/`themes`/`hours` resources
- [ ] `restaurant/src/vexcms/admin/PriceInput.tsx`
- [ ] `restaurant/src/vexcms/collections/menus.ts` — price field `Input` override wiring
- [ ] `restaurant/convex/auth/options.ts`
- [ ] tag `restaurant/03-access` pushed

#### restaurant/src/db/constants/auth.ts

Numbered edit on the scaffolded file (`packages/create-vexcms/templates/base-nextjs/src/db/constants/auth.ts`).
Everything not shown is unchanged. `user` stays exactly as scaffolded — it is still Better Auth's
`defaultRole` (`convex/auth/plugins/index.ts`) and the `anonRole` (below), so a fresh sign-up and
an anonymous visitor both still resolve to it unchanged. `staff` is a new role the admin promotes
an employee to by hand, from the Users list in `/admin` (editing `roles`), the same way magazine's
`editor`/`author` roles are assigned (Step 8).

**1 — `USER_ROLES`.**

```ts
export const USER_ROLES = {
  admin: "admin",
  user: "user",
  staff: "staff",
} as const
```

#### restaurant/convex/auth/options.ts

One edit on the scaffolded file (`packages/create-vexcms/templates/base-nextjs/convex/auth/options.ts`)
— production sign-up lockdown (decision 21), same shape as the other three scenarios' access steps: reads
the Convex env var the deploy step (Step 25) sets after the developer's own first sign-up, so
Better Auth rejects every later `/api/auth/sign-up/email` call without touching sign-in.
Everything else in `emailAndPassword` (`enabled: true`, set by the scaffold installer) is
unchanged.

```ts
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.AUTH_DISABLE_SIGN_UP === "true",
  },
```

#### restaurant/src/auth/access.ts

Numbered edit on the scaffolded file (`packages/create-vexcms/templates/base-nextjs/src/auth/access.ts`
— untouched since Step 22, still the base `admin`/`user` matrix over `images`/`users` only).
Everything not shown is unchanged. Guided stub (Design Decision 10 — `access.ts` rules):
`permissions.staff` compiles with a bare `"*": false` and a numbered `// TODO:` list for the
per-resource rules the developer fills in on camera.

**1 — imports.** `locations`/`menus`/`themes` added to the existing collections import:

```ts
import {
  TABLE_SLUG_ORGANIZATIONS,
  TABLE_SLUG_USERS,
  USER_ROLES,
} from "~/db/constants"
import { images, locations, menus, themes, users } from "~/vexcms/collections"
```

**2 — `resources`.**

```ts
  resources: [images, users, locations, menus, themes],
```

**3 — `permissions.staff`**, a new entry alongside the existing `admin`/`user`:

```ts
    [USER_ROLES.staff]: {
      "*": false,
      // TODO: 1. adminPanel — { access: true }, so a promoted staff account can reach /admin at all
      //    (mirrors the existing `[USER_ROLES.user]: { adminPanel: { access: false } }` above, inverted)
      // TODO: 2. locations — { "*": false, read: true } — staff can see which location they're
      //    editing a menu for, never rename or relocate it
      // TODO: 3. menus — true (full CRUD) — the whole point of this role: edit seasonal menus and
      //    duplicate one for next season via the built-in edit-actions-menu Duplicate item (F29,
      //    `edit.actionsMenu`, `vex.duplicate` — no code; built in, see `admin-customization.mdx`
      //    "Built-in edit actions")
      // TODO: 4. images — { "*": false, read: true } — pick an existing location photo; the media
      //    library itself stays admin-only (mirrors the base `[USER_ROLES.user]: { images: readOnly }`
      //    pattern, so uploads resolve for an anonymous visitor too via `anonRole`)
      // TODO: 5. themes — { "*": false, read: true } — lets a location's `brandTheme` relationship
      //    cell resolve its title for staff without granting theme-editing rights
      // TODO: 6. hours — deliberately NOT listed. Role-level `"*": false` above denies every
      //    action on every subject this role doesn't name (Access Control guide, "Deny-by-default"),
      //    so staff gets no read/update on `hours` at all — the "Hours & Banner" sidebar entry never
      //    renders for this role, and a direct API call is rejected server-side the same way.
    },
```

#### restaurant/src/vexcms/admin/PriceInput.tsx

New file. Guided stub (Design Decision 10 — `Input` overrides): signature + JSDoc + numbered
`// TODO:` + `throw new Error("Not implemented")`, same shape as `apps/test/src/vexcms/admin/TrimOnBlurTextInput.tsx`'s
`Input` override — a per-field chain entry receiving `FieldControlProps<number>` plus
`renderDefault` (admin-customization guide § Per-field overrides).

```tsx
"use client"

import type { FieldControlProps } from "@vexcms/core"
import type { ReactHKT } from "@vexcms/react"
import type { SlotOverrideProps } from "@vexcms/react/admin"

/**
 * Per-field `Input` override for `menus.sections[].items[].price` — renders
 * the built-in masked-number control unchanged via `renderDefault`, plus a
 * formatted currency preview beside it that updates on every keystroke.
 *
 * @param props - `FieldControlProps<number>` (`id`, `value`, `onChange`,
 *   `onBlur`, `readOnly`, `invalid`, `describedBy`) plus `renderDefault`, the
 *   built-in number control this wraps — same override-chain contract as
 *   `TrimOnBlurTextInput` (`apps/test/src/vexcms/admin/TrimOnBlurTextInput.tsx`).
 * @returns The built-in control followed by a small muted span showing
 *   `value` formatted as US currency (`Intl.NumberFormat`), or nothing when
 *   `value` is not a finite number (an empty/just-started field).
 */
export function PriceInput(props: SlotOverrideProps<ReactHKT, FieldControlProps<number>>) {
  // TODO: 1. destructure { renderDefault: RenderDefault, value, ...rest } from props
  // TODO: 2. guard: typeof value !== "number" || Number.isNaN(value) → render only
  //    <RenderDefault {...rest} value={value} />, no preview span
  // TODO: 3. format: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
  // TODO: 4. render <RenderDefault {...rest} value={value} /> followed by the formatted string in a
  //    `text-sm text-muted-foreground` span beside it
  throw new Error("Not implemented")
}
```

#### restaurant/src/vexcms/collections/menus.ts

Numbered edit — the "override wiring" the task names, on top of Step 22's stub. Everything not
shown (including the rest of the `sections` TODO) is unchanged.

**1 — import.** `PriceInput` added:

```ts
import { PriceInput } from "~/vexcms/admin/PriceInput"
```

**2 — the `price` TODO line inside `sections.items.fields.items.fields`** now names the wiring
concretely instead of a bare comment — `admin.components.Input` on the field instance (admin-customization
guide § Per-field overrides), still calling the zero-arg `number()` stub below it until the
developer's pass fills in `required`/`label`/`defaultValue`:

```ts
    // TODO: 5c. price — number({ label: "Price", required: true, admin: {
    //      mask: { mask: "decimal", storeMasked: false, options: { radixPoint: "." } },
    //      components: { Input: [{ id: "restaurant.menus.price-preview", component: PriceInput }] },
    //    } })
```

Verify: run-through rows "price override renders", "duplicate menu", "staff role cannot edit hours"
pass; tag `restaurant/03-access` pushed

---

### Step 24 — Restaurant 04–05: seed and front end [agent] — needs developer exception

Why: menu pages per location, the hours banner from the global, per-brand theme CSS.

- [ ] `restaurant/convex/seed.ts` — `runSeed(ctx, mode)` refactor + `init`/`reinit`/`reset`, restaurant content
- [ ] `restaurant/convex/demoAccounts.ts`
- [ ] `restaurant/scripts/create-demo-accounts.mjs`
- [ ] `restaurant/package.json` — `seed:reinit`, `seed:reset`, `demo:accounts` scripts
- [ ] `restaurant/.env.example` — `DEMO_*` names
- [ ] `restaurant/convex/locations.ts`
- [ ] `restaurant/convex/menus.ts`
- [ ] `restaurant/convex/hours.ts`
- [ ] `restaurant/src/components/LocationThemeStyle.tsx`
- [ ] `restaurant/src/components/HoursBanner.tsx`, `HoursBannerContent.tsx`
- [ ] `restaurant/src/app/(frontend)/(site)/layout.tsx` — mount `HoursBanner`
- [ ] `restaurant/src/app/(frontend)/(site)/locations/[slug]/page.tsx`
- [ ] `restaurant/src/app/(frontend)/(site)/locations/[slug]/menu/page.tsx`
- [ ] `restaurant/src/app/(frontend)/(site)/locations/[slug]/menu/MenuContent.tsx`
- [ ] tags `restaurant/04-seed`, `restaurant/05-front-end` pushed

#### restaurant/convex/seed.ts

Numbered edit on the scaffolded marketing-site template's `convex/seed.ts`
(`packages/create-vexcms/templates/marketing-site/convex/seed.ts` — 1245 lines of theme/siteSettings/header/footer/3-page
seed data, a single `init: internalMutation` with no mode parameter). Design Decision 9 requires
`init`/`reinit`/`reset` over one `runSeed(ctx, mode)`, mirroring `apps/www/convex/seed.ts` — this
edit refactors the existing handler into that shape and appends the restaurant content. Everything
in the existing theme/siteSettings/header/footer/page blocks that is NOT shown below keeps its
existing field values; only the per-document `if (existing) { … } else { … }` shape changes.

**1 — imports.** New table/global slugs, the internal-mutation helper already needed for `reset`:

```ts
import {
  GLOBAL_SLUG_HOURS,
  GLOBAL_SLUG_SITE_SETTINGS,
  TABLE_SLUG_FOOTERS,
  TABLE_SLUG_HEADERS,
  TABLE_SLUG_LOCATIONS,
  TABLE_SLUG_MENUS,
  TABLE_SLUG_PAGES,
  TABLE_SLUG_THEMES,
} from "~/db/constants"
```

**2 — two new theme presets**, appended to the existing `THEME_PRESETS` array (which keeps its
"Stark × Ember" entry unchanged) — one per location's brand, forking the shipped palette's shape
(`themeColors.ts`'s own doc comment: "a freshly created theme forks a working look") with only the
brand-accent tokens changed:

```ts
  {
    name: "Downtown Amber",
    fontFamily: "Geist, Inter, system-ui, sans-serif",
    radius: "6px",
    light: {
      background: "oklch(96.1% 0 0)", foreground: "oklch(13.7% 0 0)",
      card: "oklch(100% 0 0)", cardForeground: "oklch(13.7% 0 0)",
      popover: "oklch(100% 0 0)", popoverForeground: "oklch(13.7% 0 0)",
      primary: "oklch(58% 0.19 55)", primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(98% 0 0)", secondaryForeground: "oklch(13.7% 0 0)",
      muted: "oklch(98% 0 0)", mutedForeground: "oklch(50.5% 0 0)",
      accent: "oklch(94% 0.05 55)", accentForeground: "oklch(45% 0.16 50)",
      destructive: "oklch(57.7% 0.198 27)", destructiveForeground: "oklch(98% 0 0)",
      border: "oklch(85% 0 0)", input: "oklch(54.6% 0 0)", ring: "oklch(58% 0.19 55)",
      chart1: "oklch(58% 0.19 55)", chart2: "oklch(45% 0 0)", chart3: "oklch(72% 0.1 60)",
      chart4: "oklch(60% 0.04 30)", chart5: "oklch(78% 0 0)",
      sidebar: "oklch(98% 0 0)", sidebarForeground: "oklch(13.7% 0 0)",
      sidebarPrimary: "oklch(58% 0.19 55)", sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(96.1% 0 0)", sidebarAccentForeground: "oklch(13.7% 0 0)",
      sidebarBorder: "oklch(85% 0 0)", sidebarRing: "oklch(58% 0.19 55)",
    },
    dark: {
      background: "oklch(14.5% 0 0)", foreground: "oklch(98.5% 0 0)",
      card: "oklch(18% 0 0)", cardForeground: "oklch(98.5% 0 0)",
      popover: "oklch(18% 0 0)", popoverForeground: "oklch(98.5% 0 0)",
      primary: "oklch(64% 0.19 55)", primaryForeground: "oklch(14.5% 0 0)",
      secondary: "oklch(24% 0 0)", secondaryForeground: "oklch(98.5% 0 0)",
      muted: "oklch(24% 0 0)", mutedForeground: "oklch(68% 0 0)",
      accent: "oklch(28% 0.07 55)", accentForeground: "oklch(84% 0.1 55)",
      destructive: "oklch(60% 0.2 27)", destructiveForeground: "oklch(98.5% 0 0)",
      border: "oklch(28% 0 0)", input: "oklch(32% 0 0)", ring: "oklch(64% 0.19 55)",
      chart1: "oklch(64% 0.19 55)", chart2: "oklch(55% 0 0)", chart3: "oklch(76% 0.1 60)",
      chart4: "oklch(64% 0.04 30)", chart5: "oklch(82% 0 0)",
      sidebar: "oklch(18% 0 0)", sidebarForeground: "oklch(98.5% 0 0)",
      sidebarPrimary: "oklch(64% 0.19 55)", sidebarPrimaryForeground: "oklch(14.5% 0 0)",
      sidebarAccent: "oklch(24% 0 0)", sidebarAccentForeground: "oklch(98.5% 0 0)",
      sidebarBorder: "oklch(28% 0 0)", sidebarRing: "oklch(64% 0.19 55)",
    },
  },
  {
    name: "Riverside Teal",
    fontFamily: "Geist, Inter, system-ui, sans-serif",
    radius: "6px",
    light: {
      background: "oklch(96.1% 0 0)", foreground: "oklch(13.7% 0 0)",
      card: "oklch(100% 0 0)", cardForeground: "oklch(13.7% 0 0)",
      popover: "oklch(100% 0 0)", popoverForeground: "oklch(13.7% 0 0)",
      primary: "oklch(55% 0.11 195)", primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(98% 0 0)", secondaryForeground: "oklch(13.7% 0 0)",
      muted: "oklch(98% 0 0)", mutedForeground: "oklch(50.5% 0 0)",
      accent: "oklch(94% 0.04 195)", accentForeground: "oklch(40% 0.1 195)",
      destructive: "oklch(57.7% 0.198 27)", destructiveForeground: "oklch(98% 0 0)",
      border: "oklch(85% 0 0)", input: "oklch(54.6% 0 0)", ring: "oklch(55% 0.11 195)",
      chart1: "oklch(55% 0.11 195)", chart2: "oklch(45% 0 0)", chart3: "oklch(72% 0.1 60)",
      chart4: "oklch(60% 0.04 30)", chart5: "oklch(78% 0 0)",
      sidebar: "oklch(98% 0 0)", sidebarForeground: "oklch(13.7% 0 0)",
      sidebarPrimary: "oklch(55% 0.11 195)", sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(96.1% 0 0)", sidebarAccentForeground: "oklch(13.7% 0 0)",
      sidebarBorder: "oklch(85% 0 0)", sidebarRing: "oklch(55% 0.11 195)",
    },
    dark: {
      background: "oklch(14.5% 0 0)", foreground: "oklch(98.5% 0 0)",
      card: "oklch(18% 0 0)", cardForeground: "oklch(98.5% 0 0)",
      popover: "oklch(18% 0 0)", popoverForeground: "oklch(98.5% 0 0)",
      primary: "oklch(62% 0.11 195)", primaryForeground: "oklch(14.5% 0 0)",
      secondary: "oklch(24% 0 0)", secondaryForeground: "oklch(98.5% 0 0)",
      muted: "oklch(24% 0 0)", mutedForeground: "oklch(68% 0 0)",
      accent: "oklch(26% 0.05 195)", accentForeground: "oklch(80% 0.07 195)",
      destructive: "oklch(60% 0.2 27)", destructiveForeground: "oklch(98.5% 0 0)",
      border: "oklch(28% 0 0)", input: "oklch(32% 0 0)", ring: "oklch(62% 0.11 195)",
      chart1: "oklch(62% 0.11 195)", chart2: "oklch(55% 0 0)", chart3: "oklch(76% 0.1 60)",
      chart4: "oklch(64% 0.04 30)", chart5: "oklch(82% 0 0)",
      sidebar: "oklch(18% 0 0)", sidebarForeground: "oklch(98.5% 0 0)",
      sidebarPrimary: "oklch(62% 0.11 195)", sidebarPrimaryForeground: "oklch(14.5% 0 0)",
      sidebarAccent: "oklch(24% 0 0)", sidebarAccentForeground: "oklch(98.5% 0 0)",
      sidebarBorder: "oklch(28% 0 0)", sidebarRing: "oklch(62% 0.11 195)",
    },
  },
```

**3 — `SeedMode`/`SeedReport` types and the `runSeed(ctx, mode)` wrapper**, inserted before the
existing `init` export. The existing handler body (theme loop, `siteSettings` upsert, header,
footer, 3 pages) moves INTO this function unchanged in content — only its shape changes, uniformly,
from:

```ts
if (existing) {
  skipped.push("<label>")
} else {
  await ctx.db.insert(<table>, <doc>)
  created.push("<label>")
}
```

to:

```ts
if (existing) {
  if (mode === "patch") {
    await ctx.db.patch(<table>, existing._id, <doc>)
    patched.push("<label>")
  } else {
    skipped.push("<label>")
  }
} else {
  await ctx.db.insert(<table>, <doc>)
  created.push("<label>")
}
```

(the `siteSettings` global block uses `upsertGlobal` already, same `if (existingSettings && mode !== "patch")` branch `apps/www/convex/seed.ts:559` already shows — reused verbatim). Applied once, mechanically, to
every one of the existing theme/siteSettings/header/footer/3-page blocks:

```ts
type SeedMode = "insert" | "patch"

export type SeedReport = {
  created: string[]
  patched: string[]
  skipped: string[]
}

async function runSeed(ctx: MutationCtx, mode: SeedMode): Promise<SeedReport> {
  const created: string[] = []
  const patched: string[] = []
  const skipped: string[] = []

  // … existing theme loop, siteSettings upsert, header, footer, 3 pages —
  // each converted to the patch-aware shape above, content unchanged …

  // --- restaurant content, new in this step ---

  const existingDowntown = await ctx.db
    .query(TABLE_SLUG_LOCATIONS)
    .withIndex("by_slug", (q) => q.eq("slug", "downtown"))
    .first()
  const downtownTheme = await ctx.db
    .query(TABLE_SLUG_THEMES)
    .withIndex("by_name", (q) => q.eq("name", "Downtown Amber"))
    .first()
  const downtownDoc = {
    name: "Downtown",
    slug: "downtown",
    address: { street: "118 Market St", city: "Springfield", state: "IL", zip: "62701" },
    phone: "2175551234",
    brandTheme: downtownTheme ? [downtownTheme._id] : [],
  }
  let downtownId: string
  if (existingDowntown) {
    if (mode === "patch") {
      await ctx.db.patch(TABLE_SLUG_LOCATIONS, existingDowntown._id, downtownDoc)
      patched.push("location:downtown")
    } else {
      skipped.push("location:downtown")
    }
    downtownId = existingDowntown._id
  } else {
    downtownId = await ctx.db.insert(TABLE_SLUG_LOCATIONS, downtownDoc)
    created.push("location:downtown")
  }

  const existingRiverside = await ctx.db
    .query(TABLE_SLUG_LOCATIONS)
    .withIndex("by_slug", (q) => q.eq("slug", "riverside"))
    .first()
  const riversideTheme = await ctx.db
    .query(TABLE_SLUG_THEMES)
    .withIndex("by_name", (q) => q.eq("name", "Riverside Teal"))
    .first()
  const riversideDoc = {
    name: "Riverside",
    slug: "riverside",
    address: { street: "42 Harbor Ln", city: "Springfield", state: "IL", zip: "62702" },
    phone: "2175555678",
    brandTheme: riversideTheme ? [riversideTheme._id] : [],
  }
  let riversideId: string
  if (existingRiverside) {
    if (mode === "patch") {
      await ctx.db.patch(TABLE_SLUG_LOCATIONS, existingRiverside._id, riversideDoc)
      patched.push("location:riverside")
    } else {
      skipped.push("location:riverside")
    }
    riversideId = existingRiverside._id
  } else {
    riversideId = await ctx.db.insert(TABLE_SLUG_LOCATIONS, riversideDoc)
    created.push("location:riverside")
  }

  const downtownMenuDoc = {
    title: "Dinner Menu",
    location: [downtownId],
    season: ["year-round"],
    vex_status: "published" as const,
    sections: [
      {
        title: "Starters",
        items: [
          { name: "Charred Octopus", description: "Smoked paprika, white bean purée", price: 16, dietary: ["gluten-free"], isAvailable: true },
          { name: "Burrata", description: "Heirloom tomato, basil oil, sourdough", price: 14, dietary: ["vegetarian"], isAvailable: true },
        ],
      },
      {
        title: "Mains",
        items: [
          { name: "Braised Short Rib", description: "Celeriac mash, red wine jus", price: 32, dietary: [], isAvailable: true },
          { name: "Wild Mushroom Risotto", description: "Parmesan, truffle oil", price: 24, dietary: ["vegetarian", "gluten-free"], isAvailable: true },
        ],
      },
    ],
  }
  const existingDowntownMenu = await ctx.db
    .query(TABLE_SLUG_MENUS)
    .withIndex("by_location", (q) => q.eq("location", [downtownId]))
    .first()
  if (existingDowntownMenu) {
    if (mode === "patch") {
      await ctx.db.patch(TABLE_SLUG_MENUS, existingDowntownMenu._id, downtownMenuDoc)
      patched.push("menu:downtown-dinner")
    } else {
      skipped.push("menu:downtown-dinner")
    }
  } else {
    await ctx.db.insert(TABLE_SLUG_MENUS, downtownMenuDoc)
    created.push("menu:downtown-dinner")
  }

  const riversideMenuDoc = {
    title: "Summer Menu",
    location: [riversideId],
    season: ["summer"],
    seasonalUntil: Date.parse("2027-09-01"),
    vex_status: "published" as const,
    sections: [
      {
        title: "Small Plates",
        items: [
          { name: "Grilled Peach Salad", description: "Arugula, goat cheese, candied pecans", price: 13, dietary: ["vegetarian", "gluten-free"], isAvailable: true },
        ],
      },
      {
        title: "Entrées",
        items: [
          { name: "Cedar Plank Salmon", description: "Corn succotash, lemon butter", price: 28, dietary: ["gluten-free"], isAvailable: true },
          { name: "Summer Vegetable Linguine", description: "Zucchini, cherry tomato, basil", price: 21, dietary: ["vegetarian", "vegan"], isAvailable: true },
        ],
      },
    ],
  }
  const existingRiversideMenu = await ctx.db
    .query(TABLE_SLUG_MENUS)
    .withIndex("by_location", (q) => q.eq("location", [riversideId]))
    .first()
  if (existingRiversideMenu) {
    if (mode === "patch") {
      await ctx.db.patch(TABLE_SLUG_MENUS, existingRiversideMenu._id, riversideMenuDoc)
      patched.push("menu:riverside-summer")
    } else {
      skipped.push("menu:riverside-summer")
    }
  } else {
    await ctx.db.insert(TABLE_SLUG_MENUS, riversideMenuDoc)
    created.push("menu:riverside-summer")
  }

  const existingHours = await getGlobal({ ctx, config, slug: GLOBAL_SLUG_HOURS, access: { bypass: true } })
  const hoursDoc = {
    weekly: [
      { day: ["monday"], opens: "1100AM", closes: "0900PM" },
      { day: ["tuesday"], opens: "1100AM", closes: "0900PM" },
      { day: ["wednesday"], opens: "1100AM", closes: "0900PM" },
      { day: ["thursday"], opens: "1100AM", closes: "1000PM" },
      { day: ["friday"], opens: "1100AM", closes: "1100PM" },
      { day: ["saturday"], opens: "1000AM", closes: "1100PM" },
      { day: ["sunday"], opens: "1000AM", closes: "0800PM" },
    ],
    bannerText: "Now taking holiday reservations — call your nearest location.",
    bannerColor: "#b45309",
  }
  if (existingHours && mode !== "patch") {
    skipped.push("hours")
  } else {
    await upsertGlobal({ ctx, config, slug: GLOBAL_SLUG_HOURS, data: hoursDoc, access: { bypass: true } })
    if (existingHours) {
      patched.push("hours")
    } else {
      created.push("hours")
    }
  }

  return { created, patched, skipped }
}
```

**4 — `init`/`reinit` exports**, replacing the existing single `init` mutation:

```ts
export const init = internalMutation({
  args: {},
  handler: async (ctx) => runSeed(ctx, "insert"),
})

export const reinit = internalMutation({
  args: {},
  handler: async (ctx) => runSeed(ctx, "patch"),
})
```

**5 — `reset`**, the Design Decision 9 deviation — `apps/www` has none; this scenario's demo
content (`locations`/`menus`, the two collections a take can create/duplicate into) needs an exact
start state between scripts. Patches the seed back, then deletes anything in those two collections
that is not one of the four seeded natural keys (`downtown`/`riverside` slugs,
`downtown`+"Dinner Menu"/`riverside`+"Summer Menu"). `themes`/`pages`/`headers`/`footers`/`siteSettings`/`hours`
are scaffold chrome, never created fresh by a take, so `reinit`'s patch-back alone already restores
them — `reset` does not delete from those collections:

```ts
export const reset = internalMutation({
  args: {},
  handler: async (ctx) => {
    const report = await runSeed(ctx, "patch")
    const removed: string[] = []

    const seededLocationSlugs = new Set(["downtown", "riverside"])
    for (const doc of await ctx.db.query(TABLE_SLUG_LOCATIONS).collect()) {
      if (!seededLocationSlugs.has(doc.slug as string)) {
        await ctx.db.delete(TABLE_SLUG_LOCATIONS, doc._id)
        removed.push(`location:${doc.slug as string}`)
      }
    }

    const seededMenuTitles = new Set(["Dinner Menu", "Summer Menu"])
    for (const doc of await ctx.db.query(TABLE_SLUG_MENUS).collect()) {
      if (!seededMenuTitles.has(doc.title as string)) {
        await ctx.db.delete(TABLE_SLUG_MENUS, doc._id)
        removed.push(`menu:${doc.title as string}`)
      }
    }

    return { ...report, removed }
  },
})
```

#### restaurant/convex/demoAccounts.ts

New file. Sets `roles` on a user already created through Better Auth's `/sign-up/email` — that
endpoint ignores any client-supplied `roles` (`user.additionalFields.roles` carries `input: false`,
AP-027/the roles hotfix), so this internal mutation is the only way a scripted sign-up ends up with
a non-default role.

```ts
import { v } from "convex/values"

import { TABLE_SLUG_USERS } from "~/db/constants"

import { internalMutation } from "./_generated/server"

/**
 * Patches `roles` on the user matching `args.email`, bypassing Better Auth's
 * client-writable-field guard — called only from
 * `scripts/create-demo-accounts.mjs`, after that script's own HTTP sign-up
 * against `/api/auth/sign-up/email` has already succeeded (which always
 * stores the default `["user"]` role regardless of what the request body
 * carries).
 */
export const setRoles = internalMutation({
  args: { email: v.string(), roles: v.array(v.string()) },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query(TABLE_SLUG_USERS)
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()
    if (!user) {
      throw new Error(`demoAccounts:setRoles — no user found for ${args.email}`)
    }
    await ctx.db.patch(user._id, { roles: args.roles })
  },
})
```

#### restaurant/scripts/create-demo-accounts.mjs

New file. HTTP sign-up on the running app (Design Decision 9), then `npx convex run
demoAccounts:setRoles`. `422` is Better Auth's documented "user already exists" status for
`/sign-up/email` (`node_modules/better-auth/dist/api/routes/sign-up.mjs`: `APIError.from("UNPROCESSABLE_ENTITY",
BASE_ERROR_CODES.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL)`), so the script stays idempotent across
`pnpm seed:reset` re-runs instead of failing on a second take.

```js
#!/usr/bin/env node

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3230"

const ACCOUNTS = [
  { email: process.env.DEMO_ADMIN_EMAIL, password: process.env.DEMO_ADMIN_PASSWORD, name: "Demo Admin", role: "admin" },
  { email: process.env.DEMO_STAFF_EMAIL, password: process.env.DEMO_STAFF_PASSWORD, name: "Demo Staff", role: "staff" },
]

async function signUp(account) {
  if (!account.email || !account.password) {
    throw new Error(`Missing DEMO_${account.role.toUpperCase()}_EMAIL/DEMO_${account.role.toUpperCase()}_PASSWORD in .env.local`)
  }
  const response = await fetch(`${SITE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: account.email, password: account.password, name: account.name }),
  })
  if (!response.ok && response.status !== 422) {
    throw new Error(`Sign-up failed for ${account.email}: ${response.status} ${await response.text()}`)
  }
}

for (const account of ACCOUNTS) {
  await signUp(account)
  console.log(`Signed up ${account.email} (${account.role})`)
}

const { execFileSync } = await import("node:child_process")
for (const account of ACCOUNTS) {
  execFileSync(
    "npx",
    ["convex", "run", "demoAccounts:setRoles", JSON.stringify({ email: account.email, roles: [account.role] })],
    { stdio: "inherit" },
  )
}
```

#### restaurant/package.json

Numbered edit. Everything not shown is unchanged.

**1 — `scripts`**, three new entries beside the existing `"seed": "convex run seed:init"`:

```json
    "seed:reinit": "convex run seed:reinit",
    "seed:reset": "convex run seed:reset",
    "demo:accounts": "node --env-file=.env.local scripts/create-demo-accounts.mjs",
```

(`--env-file` is Node 20.6+'s built-in `.env` loader — no new dependency.)

#### restaurant/.env.example

Numbered edit on the scaffolded `_env.example`. Everything not shown is unchanged.

**1 — `DEMO_*` names**, appended at the end:

```
DEMO_ADMIN_EMAIL=""
DEMO_ADMIN_PASSWORD=""
DEMO_STAFF_EMAIL=""
DEMO_STAFF_PASSWORD=""
```

#### restaurant/convex/locations.ts

New file. `locations` is not versioned (no `versions.drafts`), so there is no preview-draft
branch here — only `pages.ts`'s `getBySlug`/`publishedSlugs` shape, not `getBySlugPreview`.

```ts
import { v } from "convex/values"

import { TABLE_SLUG_LOCATIONS } from "~/db/constants"
import { find, publishedSlugs as readPublishedSlugs } from "~/vexcms/api"

import { query } from "./_generated/server"

/**
 * Returns the location matching `slug`, with `brandTheme` populated so the
 * front end can render it with `buildThemeCss` directly — or an empty array.
 * Access bypassed: read by anonymous visitors before any session exists.
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await find({
      ctx,
      collection: TABLE_SLUG_LOCATIONS,
      withIndex: { name: "by_slug", range: (q) => q.eq("slug", slug) },
      limit: 1,
      populate: { brandTheme: true },
      access: { bypass: true },
    })
  },
})

/**
 * `{ slug, createdAt, updatedAt? }` for every location — `generateStaticParams`
 * for both `/locations/[slug]` and `/locations/[slug]/menu`.
 */
export const publishedSlugs = query({
  args: {},
  handler: async (ctx) => {
    return await readPublishedSlugs({ access: { bypass: true }, collection: TABLE_SLUG_LOCATIONS, ctx })
  },
})
```

#### restaurant/convex/menus.ts

New file. `menus` IS versioned (`versions.drafts: true`, Step 22), so this mirrors `pages.ts`'s
`getBySlug`/`getBySlugPreview` pair exactly, keyed by `location` (relationship — always stored as
an array, `apps/test/convex/seed.ts:1947`'s `q.eq("article", [publishedArticle])` is the same
single-value-relationship-index idiom) instead of `slug`.

```ts
import { DRAFT_ACTIONS } from "@vexcms/core"
import { v } from "convex/values"

import { TABLE_SLUG_MENUS } from "~/db/constants"
import { find } from "~/vexcms/api"

import { query } from "./_generated/server"

/** The published menu for `locationId`, or an empty array. Access bypassed — read by anonymous visitors. */
export const getByLocation = query({
  args: { locationId: v.string() },
  handler: async (ctx, { locationId }) => {
    return await find({
      ctx,
      collection: TABLE_SLUG_MENUS,
      withIndex: { name: "by_location", range: (q) => q.eq("location", [locationId]) },
      limit: 1,
      access: { bypass: true },
    })
  },
})

/**
 * Draft-preferring counterpart of `getByLocation`, the live-preview base
 * layer — same `readDrafts`-gated shape as `pages.getBySlugPreview`.
 */
export const getByLocationPreview = query({
  args: { locationId: v.string() },
  handler: async (ctx, { locationId }) => {
    const matches = await find({
      ctx,
      collection: TABLE_SLUG_MENUS,
      withIndex: { name: "by_location", range: (q) => q.eq("location", [locationId]) },
      drafts: true,
      access: { action: DRAFT_ACTIONS.readDrafts },
    })
    const draft = matches.find((doc) => doc.vex_status === "draft")
    return draft ? [draft] : matches.filter((doc) => doc.vex_status === "published")
  },
})
```

#### restaurant/convex/hours.ts

New file. Same shape as `convex/siteSettings.ts`.

```ts
import { getGlobal } from "@vexcms/core/server"

import { GLOBAL_SLUG_HOURS } from "~/db/constants"
import config from "~/vex.config.server"

import { query } from "./_generated/server"

/** Weekly hours + banner. Access bypassed — read by anonymous visitors before any session exists. */
export const get = query({
  args: {},
  handler: async (ctx) => {
    return await getGlobal({ ctx, config, slug: GLOBAL_SLUG_HOURS, access: { bypass: true } })
  },
})
```

#### restaurant/src/components/LocationThemeStyle.tsx

New file. Per-location brand palette — rendered inside `/locations/[slug]/page.tsx`'s own tree, so
it sits AFTER `(frontend)/layout.tsx`'s site-wide `<ThemeStyle />` in document order. Both emit the
"site" `:root` scope at equal (0,1,0) specificity (theming guide § Site vs admin scope), so the
later-in-source block wins for as long as this location page is mounted — no hoisting, so it
correctly stops applying the moment React unmounts this tree (a client-side navigation away from
`/locations/[slug]`).

```tsx
import { buildThemeCss } from "@vexcms/core"

import type { ThemesDocument } from "~/vex.types"

export function LocationThemeStyle(props: { theme: ThemesDocument | null }) {
  if (!props.theme) return null
  const css = buildThemeCss({ theme: props.theme, scope: "site" })
  if (!css) return null
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
```

#### restaurant/src/components/HoursBanner.tsx

New file. Server component — same `initialData` hand-off shape `(site)/layout.tsx` already uses
for `SiteHeader`/`SiteFooter`.

```tsx
import { api } from "@convex/_generated/api"

import { vex } from "~/lib/vex"

import { HoursBannerContent } from "./HoursBannerContent"

export async function HoursBanner() {
  let initialData = null
  try {
    initialData = await vex.query(api.hours.get)
  } catch {
    // Convex unreachable at build time — render nothing server-side; the
    // client query below hydrates once a deployment is reachable.
  }
  return <HoursBannerContent initialData={initialData} />
}
```

#### restaurant/src/components/HoursBannerContent.tsx

New file. The step's "live preview of ... the hours global" — `useLivePreviewDocumentQuery` overlays
the editor's unsaved `bannerText`/`bannerColor` the same way the theming guide's `siteSettings`
example does, no reload.

```tsx
"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { useLivePreviewDocumentQuery } from "@vexcms/react"

import type { HoursGlobal } from "~/vex.types"

export function HoursBannerContent(props: { initialData: HoursGlobal | null }) {
  const { data: hours } = useLivePreviewDocumentQuery(
    { ...convexQuery(api.hours.get, {}), initialData: props.initialData ?? undefined },
    "hours",
  )

  if (!hours?.bannerText) return null

  return (
    <div
      className="px-4 py-2 text-center text-sm font-medium text-white"
      style={{ backgroundColor: hours.bannerColor || undefined }}
    >
      {hours.bannerText}
    </div>
  )
}
```

#### restaurant/src/app/(frontend)/(site)/layout.tsx

Numbered edit on the scaffolded marketing-site layout (header/footer chrome). Everything not shown
is unchanged.

**1 — import.**

```tsx
import { HoursBanner } from "~/components/HoursBanner"
```

**2 — mount**, before the existing `<SiteHeader initialData={headerData} />`:

```tsx
        <HoursBanner />
        <SiteHeader initialData={headerData} />
```

#### restaurant/src/app/(frontend)/(site)/locations/[slug]/page.tsx

New file. Not versioned, so no `draftMode()` branch — mirrors the reachable/not-reachable split of
`[slug]/page.tsx` without its preview half.

```tsx
import { api } from "@convex/_generated/api"
import { vexStaticParams } from "@vexcms/next/seo"
import { notFound } from "next/navigation"

import { LocationThemeStyle } from "~/components/LocationThemeStyle"
import { vex } from "~/lib/vex"

export const revalidate = 3600

export async function generateStaticParams() {
  return await vexStaticParams({
    client: vex,
    query: api.locations.publishedSlugs,
    paramName: "slug",
    getSlug: (item) => item.slug,
  })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [location] = await vex.query(api.locations.getBySlug, { slug })
  return { title: location?.name ?? "Location" }
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let reachable = true
  let location
  try {
    ;[location] = await vex.query(api.locations.getBySlug, { slug })
  } catch {
    reachable = false
  }

  if (reachable && !location) notFound()
  if (!location) return null

  const theme = location.brandTheme?.[0] ?? null

  return (
    <>
      <LocationThemeStyle theme={theme} />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold">{location.name}</h1>
        <p className="mt-2 text-muted-foreground">
          {location.address?.street}, {location.address?.city}, {location.address?.state}{" "}
          {location.address?.zip}
        </p>
        <p className="mt-1">{location.phone}</p>
        <a className="mt-6 inline-block underline" href={`/locations/${location.slug}/menu`}>
          View menu
        </a>
      </main>
    </>
  )
}
```

#### restaurant/src/app/(frontend)/(site)/locations/[slug]/menu/page.tsx

New file. The location itself is fetched published-only (routing only needs its `_id`/`name`);
the MENU query branches on `draftMode()`, same structural split as `[slug]/page.tsx`.

```tsx
import { api } from "@convex/_generated/api"
import { vexStaticParams } from "@vexcms/next/seo"
import { fetchQuery } from "convex/nextjs"
import { draftMode } from "next/headers"
import { notFound } from "next/navigation"

import { getToken } from "~/auth/server"
import { vex } from "~/lib/vex"

import { MenuContent } from "./MenuContent"

export const revalidate = 3600

export async function generateStaticParams() {
  return await vexStaticParams({
    client: vex,
    query: api.locations.publishedSlugs,
    paramName: "slug",
    getSlug: (item) => item.slug,
  })
}

export default async function LocationMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let location
  try {
    ;[location] = await vex.query(api.locations.getBySlug, { slug })
  } catch {
    location = undefined
  }
  if (!location) notFound()

  const draft = await draftMode()
  if (draft.isEnabled) {
    const token = await getToken()
    let initialData
    try {
      initialData = await fetchQuery(
        api.menus.getByLocationPreview,
        { locationId: location._id },
        token ? { token } : undefined,
      )
    } catch {
      initialData = undefined
    }
    return (
      <>
        <meta name="vex-session" content="1" />
        <MenuContent locationId={location._id} locationName={location.name} initialData={initialData} draftMode />
      </>
    )
  }

  const initialData = await vex.query(api.menus.getByLocation, { locationId: location._id })
  return <MenuContent locationId={location._id} locationName={location.name} initialData={initialData} />
}
```

#### restaurant/src/app/(frontend)/(site)/locations/[slug]/menu/MenuContent.tsx

New file. The step's "live preview of a menu" — `useLivePreviewQuery` (array-returning, narrows to
`[0]`) over whichever base layer the page above picked.

```tsx
"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { useLivePreviewQuery } from "@vexcms/react"

import type { MenusDocument } from "~/vex.types"

export function MenuContent(props: {
  locationId: string
  locationName: string
  initialData?: MenusDocument[]
  draftMode?: boolean
}) {
  const query = props.draftMode ? api.menus.getByLocationPreview : api.menus.getByLocation
  const { data: menu } = useLivePreviewQuery(
    { ...convexQuery(query, { locationId: props.locationId }), initialData: props.initialData },
    "menus",
  )

  if (!menu) {
    return <p className="px-4 py-12 text-center text-muted-foreground">No menu published yet.</p>
  }

  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">
        {props.locationName} — {menu.title}
      </h1>
      {menu.sections?.map((section) => (
        <section key={section.id} className="mt-8">
          <h2 className="text-xl font-semibold">{section.title}</h2>
          <ul className="mt-4 space-y-4">
            {section.items?.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {item.name}
                    {item.isAvailable === false ? " (unavailable)" : ""}
                  </p>
                  {item.description ? (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  ) : null}
                  {item.dietary?.length ? (
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {item.dietary.join(" · ")}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 font-medium">
                  {typeof item.price === "number" ? currency.format(item.price) : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
```

Verify: `pnpm build` 0 with `/locations/[slug]`, `/locations/[slug]/menu` prerendered for
`downtown`/`riverside`; editing a menu's price/section title in the admin updates
`/locations/[slug]/menu` through the live-preview split pane without a reload (`useLivePreviewQuery`);
editing `bannerText`/`bannerColor` on the `hours` global updates the banner on `/` without a reload
(`useLivePreviewDocumentQuery`); `pnpm seed` on an empty deployment creates 2 themes + 2 locations +
2 menus + hours; `pnpm seed:reinit` restores an edited menu section; `pnpm seed:reset` removes a
demo-duplicated menu and restores the start state; `pnpm demo:accounts` creates admin/staff with
the right roles; tags `restaurant/04-seed`, `restaurant/05-front-end` pushed

---

### Step 25 — Restaurant 06: deploy, playbook, run-through [agent] — needs developer exception

Why: the developer owns the production deploy himself (decision 6); the agent verifies it, closes sign-up,
and records it, same pattern as magazine's Step 11.
Waits for: human — restaurant Convex prod + Vercel project + env set up (`CONVEX_DEPLOY_KEY`
Production-scoped, Vercel build command `pnpm vex:deploy --cmd 'pnpm build'`, first sign-up done
by the developer so that account becomes admin).

- [ ] check the production build log: `vex deploy --cmd 'pnpm build'` ran exactly once, on the final
      push, and the Next.js build it triggered succeeded (Step 3's `vex deploy` flag-passthrough fix)
- [ ] verify the prod URL returns 200 with the seeded locations/menus/hours banner, and `/admin`
      sign-in works with the developer's own account
- [ ] sign-up lockdown (decision 21): confirm the developer already signed up first → run
      `pnpm demo:accounts` against the prod URL → `npx convex env set AUTH_DISABLE_SIGN_UP true --prod`;
      verify `POST /api/auth/sign-up/email` on prod now returns an error status, and signing in with
      the demo staff account still works
- [ ] `restaurant/README.md` — add the "Live demo" line (site URL, `/admin`)
- [ ] fix `guides/deployment.mdx` for any deviation from what the production build log actually shows
      (same discipline as magazine's Step 11, which already did this once — a second clean run
      through an unchanged guide should need no further fixes)
- [ ] `.agent/docs/specs/2026-11-09-golden-use-cases/playbooks/restaurant.md`
- [ ] `.agent/docs/specs/2026-11-09-golden-use-cases/golden-runthrough.md` § restaurant
- [ ] tag `restaurant/06-deployed` pushed

**Deploy**

By reference to magazine's Step 11, which already established the pattern: the developer alone
creates the Convex prod deployment, the Vercel project, and sets every prod env var and the
`pnpm vex:deploy --cmd 'pnpm build'` build command (decision 15's `vex deploy` flag-passthrough fix — `--cmd`
injects `NEXT_PUBLIC_CONVEX_URL` into the build, so Vercel no longer needs it set by hand), then
triggers the deploy himself. No agent-run `vercel link`/`env add`/`--prod` (decision 6). The agent only
reads the resulting build log and runs the Convex-CLI-only verification/seeding/lockdown sequence
below, scoped to `restaurant/` under the existing P-024 exception (Design Decision 14):

```bash
cd ~/Documents/Projects/vexcms-examples/restaurant
npx convex run seed:init --prod
NEXT_PUBLIC_SITE_URL=<the production URL> pnpm demo:accounts
npx convex env set AUTH_DISABLE_SIGN_UP true --prod
git tag restaurant/06-deployed
git push && git push --tags
```

#### playbooks/restaurant.md

New file. Design Decision 11's shape (stage tags, accounts, seed data, launch day, 5-/15-minute
scripts, shot list), following `launch-coordination.md`'s board-rule conventions and
`playbooks/magazine.md`'s established shape (Step 12) for the shared table columns. D2 alternate
(Design Decision 3): the live-preview story, told through a menu edit and the hours banner instead
of an article. Callouts cite the two genuinely-missing features this scenario would otherwise fake:
online ordering needs a visitor-facing form (#57, Form builder) and a reservations integration
needs an outbound notification (#60, Outbound webhooks) — `inventory.md`'s own "Not shipped — never
faked on camera" table.

````md
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
````

#### .agent/docs/specs/2026-11-09-golden-use-cases/golden-runthrough.md

New section, appended to the shared `golden-runthrough.md` (created by magazine's Step 12),
mirroring `.agent/docs/specs/2026-11-06-launch-infrastructure/n-runthrough.md`'s header table + per-check
rows. Every row starts `pending` — this writer has no running deployment to execute against (Steps
22–25 are `[dev]`/stub-guided and `needs developer exception`; the actual run happens once the
exception is granted and the stubs above are filled in):

```md
## restaurant

| | restaurant |
|---|---|
| Folder | `~/Documents/Projects/vexcms-examples/restaurant` |
| Port | 3230 |
| Convex project | `vex-example-restaurant` |
| Answers | name `restaurant`, Next.js, port 3230, email/password yes, orgs no, no OAuth, git yes, install yes (no `--bare`) |

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Scaffold | `pnpm create vexcms@alpha restaurant` | Install, lint, format succeed | pending |
| `vex dev` generates | `pnpm vex:dev` | `Location`/`Menu`/`HoursGlobal` in `vex.schema.ts`/`vex.types.ts`; admin shows Locations, Menus, Hours & Banner | pending |
| `pnpm typecheck` | `pnpm typecheck` | exits 0 | pending |
| Staff role denied `hours` | sign in as staff, open `/admin` | "Hours & Banner" absent from the sidebar; a direct `hours` read/update is rejected server-side | pending |
| Price `Input` override renders | open a menu item's price field in the admin | Formatted currency preview beside the masked number input | pending |
| Duplicate menu | ⋯ menu → Duplicate on Downtown's Dinner Menu | New draft menu created, original untouched | pending |
| Live preview — menu | edit a menu section/price with the split pane open | `/locations/[slug]/menu` updates before Save | pending |
| Live preview — hours | edit `bannerText`/`bannerColor` on the Hours & Banner global | `/` banner updates before Save | pending |
| Per-brand theme CSS | `/locations/downtown` vs `/locations/riverside` | Distinct `:root` palettes (amber vs teal) | pending |
| `pnpm seed` | on an empty deployment | 2 themes + 2 locations + 2 menus + hours created | pending |
| `pnpm seed:reinit` | after hand-editing a seeded menu | Edit reverted to the seed's values | pending |
| `pnpm seed:reset` | after duplicating a menu | Duplicate removed; seed restored | pending |
| `pnpm demo:accounts` | fresh deployment | admin/staff created with the right roles | pending |
| `pnpm build` | `pnpm build` | exits 0; `/`, `/locations/downtown`, `/locations/downtown/menu`, `/locations/riverside`, `/locations/riverside/menu` prerendered | pending |
| Deploy | human sets up Convex prod + Vercel project + env, triggers the build | production build log shows `vex deploy --cmd 'pnpm build'` ran once; prod URL 200; `/admin` sign-in works | pending |
| Prod seed + accounts | `npx convex run seed:init --prod`, `pnpm demo:accounts` against the prod URL | Same seed/accounts as dev | pending |
| Sign-up lockdown | `npx convex env set AUTH_DISABLE_SIGN_UP true --prod` | `POST /api/auth/sign-up/email` on prod returns an error status; sign-in with the demo staff account still works | pending |
```

Verify: prod URL 200; `golden-runthrough.md` § restaurant exists with every row (all `pending` until
the P-024 exception is granted and Steps 22–24 are run for real — see writer-notes); tag
`restaurant/06-deployed` pushed

### Step 26 — Live deployments: README links + health check [agent]

Why: decision 6 — production deployments stay live (the developer creates them and the agent never
tears them down); every live URL needs to be discoverable from the examples repo, and a
scheduled check catches a deployment going dark without anyone noticing.
Waits for: GU-11, GU-17, GU-21, GU-25 done (every scenario's Convex prod + Vercel production
deploy step).

- [ ] Confirm each `<slug>/README.md`'s "Live demo" line (site URL, `/admin`) is present — it's
      written at that scenario's own deploy step (GU-11/17/21/25); fix any that drifted
- [ ] `README.md` (examples repo root) — fill the "Live demos" table (Step 5's placeholder) with
      the four site URLs
- [ ] `.github/workflows/live-check.yml` (new)
- [ ] curl each site URL and its `/admin` route — confirm `200` for all eight
- [ ] § Log line (board, under GU's own rows)

#### README.md

Numbered edit. Anchor: the "## Live demos" table from Step 5 (every cell currently reads
`_pending — Step 26_`). Replace the table body with the real URLs, e.g.:

````markdown
## Live demos

| Scenario | Live site | Admin |
|---|---|---|
| Magazine | https://vexcms-example-magazine.vercel.app | https://vexcms-example-magazine.vercel.app/admin |
| Real estate | https://vexcms-example-real-estate.vercel.app | https://vexcms-example-real-estate.vercel.app/admin |
| Conference | https://vexcms-example-conference.vercel.app | https://vexcms-example-conference.vercel.app/admin |
| Restaurant | https://vexcms-example-restaurant.vercel.app | https://vexcms-example-restaurant.vercel.app/admin |
````

(URLs above are the default `vexcms-example-<slug>.vercel.app` domain from the Vercel project
naming convention — Step 26 substitutes whatever domain each scenario's own README actually
lists, including a custom domain the developer wired in at GU-11/17/21/25.)

#### .github/workflows/live-check.yml

````yaml
name: Live check

on:
  schedule:
    - cron: "0 13 * * 1" # Mondays 13:00 UTC
  workflow_dispatch:

jobs:
  check:
    name: Curl production URLs
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      # URLs mirror each <slug>/README.md's "Live demo" line — update both in
      # the same edit if a custom domain replaces the default *.vercel.app one.
      matrix:
        include:
          - slug: magazine
            site: https://vexcms-example-magazine.vercel.app
          - slug: real-estate
            site: https://vexcms-example-real-estate.vercel.app
          - slug: conference
            site: https://vexcms-example-conference.vercel.app
          - slug: restaurant
            site: https://vexcms-example-restaurant.vercel.app
    steps:
      - name: curl site (expect 200)
        run: |
          code=$(curl -sS -o /dev/null -w "%{http_code}" "${{ matrix.site }}/")
          echo "site status: $code"
          test "$code" = "200"

      - name: curl /admin (expect 200)
        run: |
          code=$(curl -sS -o /dev/null -w "%{http_code}" "${{ matrix.site }}/admin")
          echo "admin status: $code"
          test "$code" = "200"
````

A failing curl (non-`200`) fails the job for that scenario — `fail-fast: false` so one
scenario's outage doesn't hide the other three's results.

#### launch-coordination.md

Board edit (own row, rule 2 — no lock needed):

````markdown
- <ISO time> GU: Step 26 done — every `<slug>/README.md` and the examples repo root `README.md`
  list the four live URLs (site + `/admin`); `.github/workflows/live-check.yml` added (weekly
  curl of all four, fails on non-200); all eight curls returned 200 at write time. No locks
  held.
````

Verify:
- `curl -sS -o /dev/null -w "%{http_code}" <site-url>/` returns `200` for all four scenarios
- `curl -sS -o /dev/null -w "%{http_code}" <site-url>/admin` returns `200` for all four
  scenarios
- `actionlint .github/workflows/live-check.yml` clean
- `rg -n "pending — Step 26" README.md magazine/README.md real-estate/README.md conference/README.md restaurant/README.md` prints nothing
- § Log line present

---

### Step 27 — Release: repo public, 0.1.0 bump, retag [agent] — needs developer exception

Why: posts link a public repo on 0.1.0, not a private one on an alpha.
Waits for: Release mechanics (`changeset pre exit` + publish); human — flip `vexcms/examples` public.

- [ ] Confirm `vexcms/examples` is public (human queue item checked off) before touching any file
- [ ] `magazine/package.json` — every `@vexcms/*` dependency (and `create-vexcms` if present in devDependencies) pinned to exact `0.1.0`
- [ ] `real-estate/package.json` — same
- [ ] `conference/package.json` — same
- [ ] `restaurant/package.json` — same
- [ ] per example: `pnpm install`
- [ ] per example: `pnpm vex:generate`
- [ ] per example: `pnpm typecheck`
- [ ] per example: `pnpm lint`
- [ ] per example: commit the version bump
- [ ] per example: `git tag <slug>/07-v0.1.0` and push commit + tag
- [ ] confirm CI is green on each pushed commit
- [ ] README version line updated per example

#### magazine/package.json

Numbered edit (1 of 4, same shape repeats for `real-estate`, `conference`, `restaurant`).
Everything not shown is unchanged.

**1 — dependencies.** Every `@vexcms/*` entry pinned from `0.1.0-alpha.35` to the released exact
version:

```json
    "@vexcms/better-auth": "0.1.0",
    "@vexcms/core": "0.1.0",
    "@vexcms/file-storage": "0.1.0",
    "@vexcms/next": "0.1.0",
    "@vexcms/react": "0.1.0",
    "@vexcms/richtext-plate": "0.1.0",
```

(only the packages the scenario actually depends on — `vex:deploy`/`vex:generate` resolve the
real set per example from its own `package.json`, Step 6's scaffold).

**2 — devDependencies.** If `create-vexcms` is present (used only at scaffold time, Step 6; most
examples will have already removed it from `package.json` once scaffolded — check before editing):

```json
    "create-vexcms": "0.1.0",
```

**Command sequence per example**

```bash
cd ~/Documents/Projects/vexcms-examples/magazine
pnpm install
pnpm vex:generate
pnpm typecheck
pnpm lint
git add package.json pnpm-lock.yaml
git commit -m "chore: bump to vexcms 0.1.0"
git tag magazine/07-v0.1.0
git push && git push --tags
```

repeated for `real-estate`, `conference`, `restaurant` (ports 3210/3220/3230, their own Convex
projects). `pnpm vex:generate` is the template's `vex dev --once` script
(`packages/create-vexcms/templates/base-nextjs/package.json`) — it pushes schema/codegen to the
scenario's **dev** Convex deployment, which is why this step is marked "needs developer
exception" (Design Decision 14's P-024 scope covers `vex dev` inside
`~/Documents/Projects/vexcms-examples/<slug>`); it does not touch the scenario's own, separately
live production deployment, which stays exactly as Step 26 last confirmed it (decision 6 — production
deployments stay live, they are never paused or torn down).

The earlier stage tags (`<slug>/01-scaffold` … `<slug>/06-deployed`) stay on their
`0.1.0-alpha.35` commits — they are historical demo resume points for the 15-minute script
(Design Decision 8/11), not moved. `playbooks/<slug>.md`'s tag references remain valid because
they name those tags, not a version number.

#### magazine/README.md

Edit (anchor: the version line near the top of the README, written at Step 6's scaffold from
the template). Everything not shown is unchanged — including the "Live demo" line Step 26
wrote, which keeps pointing at the same production deployment.

**1 — version line.**

```md
Built with [VexCMS](https://vexcms.dev) 0.1.0.
```

(same single-line edit in `real-estate/README.md`, `conference/README.md`,
`restaurant/README.md`).

Verify:
- per example, from a clean clone after push: `pnpm install && pnpm vex:generate && pnpm typecheck && pnpm lint` exits 0 with every `@vexcms/*` resolved at exactly `0.1.0`
- `git log --oneline -1 <slug>/07-v0.1.0` resolves to the bump commit, for all four tags
- CI (`.github/workflows/ci.yml`, Design Decision 5: `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint`) green on each pushed commit
- `rg -n "alpha" magazine/package.json real-estate/package.json conference/package.json restaurant/package.json` prints nothing
- each scenario's production site/`.admin` still return `200` (unaffected by this step — confirms the dev-only `vex:generate` call above didn't touch prod)

---

### Step 28 — Bookkeeping [agent]

Why: cross-spec decision 8 — each spec's final step edits the launch plan and backlog itself.
Verify: launch plan § Release mechanics has the examples flip + bump rows; `backlog.md` and `use-case-backlog.md` carry every gap found in the run-throughs; every GU row `done` or `human`; `harness tasks` updated

- [ ] take the `v0.1.0-launch-plan.md` + `backlog.md` board lock
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` § Release mechanics — two new rows
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` § T / § U pointer to this spec's playbooks + run-through
- [ ] release the `v0.1.0-launch-plan.md` + `backlog.md` board lock
- [ ] `.agent/docs/product/backlog.md` — one entry per Gaps-section row not fixed by Steps 3–4,
      plus decision 23's "single relationships stored as a plain id" entry, plus every gap the four
      run-throughs surfaced
- [ ] `.agent/docs/product/use-case-backlog.md` — refresh rule appended
- [ ] board: every remaining GU row set `done` or `human`, § Log line
- [ ] `harness tasks move "golden" --to "Recently Done"` (read-only preview of the command; not run by this writer — see writer-notes)
- [ ] session log entry: `.agent/docs/session-log/2026/11/2026-11-<dd>.log.md` § GU

#### v0.1.0-launch-plan.md

Board lock required (`.agent/docs/product/v0.1.0-launch-plan.md` + `backlog.md`, rule 6): re-read
the § Locks row, write `LOCKED GU GU-28 <ISO time>`, make the two edits below, run the edits'
own checks (file renders, no broken internal links), then set the row back to `free`.

- [ ] `LOCKED GU GU-28 <ISO time>` written to the § Locks row before editing
- [ ] § Locks row set back to `free` after editing

Numbered edit, anchor by heading. Everything not shown is unchanged.

**1 — § Release mechanics Tasks list.** Add two rows after the existing Dependabot row (last
bullet under `## Release mechanics` → `### Tasks`):

```md
- [ ] Flip `vexcms/examples` public (`2026-11-09-golden-use-cases` Step 27 precondition)
- [ ] Bump every example in `vexcms/examples` to `0.1.0`, retag `<slug>/07-v0.1.0` (`2026-11-09-golden-use-cases` Step 27)
```

**2 — § T / § U pointer.** Wherever § T and § U track launch content (the `## T — Launch content`
and `## U — ...` sections' own task lists), add one line each pointing at this spec's playbook
and run-through, so a reader following the launch plan finds the demo material:

```md
- [ ] Golden-use-case demos (clips, 5-/15-minute scripts, run-through evidence): `2026-11-09-golden-use-cases/playbooks/` and `golden-runthrough.md`
```

#### backlog.md

One entry per `inventory.md` § Gaps row not already closed by Steps 3–4, plus decision 23's new entry,
following the file's `## Entry format` (What · Why · Lift · Why deferred · Detail). The
Steps-3–4-closed rows (no deployment guide; scaffold README/`vex:deploy`; `vex deploy` forwards
no flags to `convex deploy` — closed by Step 3's decision 15 flag-passthrough fix) are excluded — only
the rows whose Disposition reads "`backlog.md` entry" or "confirm in Step 6; `backlog.md`
entry" land here, plus any new gap a run-through (Steps 7, 11, 15, 19, 23) actually surfaced on
top of the ones already listed:

```md
---

## Single relationships stored as a plain id

**What.** A single-cardinality `relationship` field (`hasMany: false`) still stores its value as
a one-element `Id[]` array, the same shape a `hasMany: true` field uses — never a bare id. Every
caller (access checks, `where`/`filter` callbacks, front-end code reading a document) has to
know this and write `[id]`/`.includes(id)` instead of a plain equality check.

**Why.** Ergonomics only — indexing already works correctly today: `normalizeArrayStoredWhere`
(`packages/core/src/db/queryArgs.ts`) wraps a single-cardinality field's `eq`/`neq` value in a
one-element array before a `where` query runs, and `indexedOwnerCheck`
(`packages/core/src/access/buildChecks.ts`) does the same for `withIndex` ranges, so lookups and
owner checks are correct and indexed either way. The friction is purely that every hand-written
comparison (a raw `withIndex` range, a plain-callback access check, app code reading
`doc.authorId`) has to remember the array wrapping — `apps/docs/src/content/docs/guides/
access-control.mdx`'s `authorId` examples got this wrong twice before this spec's Step 3 fixed
them (decision 15, `2026-11-09-golden-use-cases`).

**Lift.** Unassessed — storing a single relationship as a plain id instead of `[id]` would touch
every relationship reader across `apps/www`, `apps/test`, every template, and every project
built on today's shape: a one-time data migration (array → scalar) for every existing
deployment, a schema-validator change, and a `hasMany` toggle (false → true) becoming a real
migration instead of a no-op reinterpretation of the same stored shape. `hasMany: true`
(membership) fields would keep the array shape regardless — array membership is unindexable by
a Convex index either way, so there's no win there.

**Why deferred.** Not deferred so much as parked: the cost (migrating every existing consumer)
outweighs the benefit (removing a footgun that's now also documented, decision 15) until a reason bigger
than ergonomics shows up — e.g. an external API surface that needs the un-wrapped shape.

**Detail.** `packages/core/src/db/queryArgs.ts` `normalizeArrayStoredWhere`;
`packages/core/src/access/buildChecks.ts` `indexedOwnerCheck`; `apps/docs/src/content/docs/
guides/access-control.mdx`.

---

## No test-kit guide

**What.** `@vexcms/react/testing` (the exported testing kit from `2026-09-04-react-test-suite`)
has no docs page under `apps/docs/src/content/docs/guides/`.

**Why.** Every example in `vexcms/examples` ships with no unit tests (Design Decision 10's
`[agent]` tier covers scaffolding/seeds/scripts/front end, not a test suite) — writing the guide
without a canonical consumer risks documenting an API shape nobody has exercised end to end.

**Lift.** Unassessed.

**Why deferred.** No consumer yet outside the first-party `apps/test`/`apps/www` suites; write
the guide once a real downstream project (example or user report) needs it.

**Detail.** `packages/react/src/testing/` exports; `2026-09-04-react-test-suite` spec.

---

## `--bare` keeps a stale `"seed": "convex run seed:init"` script with no `convex/seed.ts`

**What.** `templates/base-nextjs/package.json`'s `seed` script assumes `convex/seed.ts` exists;
`--bare` scaffolds skip the file entirely (`create-vexcms` integration test `marketingOnly` list),
so a fresh `--bare` project's `pnpm seed` fails with "module not found" instead of a clear error
or being omitted.

**Why.** Every GU scenario provides its own `convex/seed.ts` by Step 9/13/17/21 regardless of
template, so the gap never blocked a scenario — it surfaces only for a stranger scaffolding
`--bare` and running `pnpm seed` before writing a seed file.

**Lift.** Unassessed — either drop the `seed` script from `--bare`'s generated `package.json`, or
ship a `convex/seed.ts` stub that no-ops with a clear message.

**Why deferred.** Cosmetic rough edge, not a functional gap; no example or docs page points a
user at `pnpm seed` before they've written one. Confirmed present during Step 6's precondition
checks (`inventory.md` § Gaps).

**Detail.** `packages/create-vexcms/templates/base-nextjs/package.json`;
`packages/create-vexcms/src/installers/` `marketingOnly` list.

---
```

(Entries above are representative stubs for the Gaps-section rows requiring a `backlog.md`
entry, plus decision 23's new "single relationships stored as a plain id" entry (no code change — see
writer-notes); the agent running Step 28 appends one entry per gap actually confirmed by the
completed Steps 6–25 run-throughs, including any new ones those steps surface beyond what
`inventory.md` lists today — this writer cannot enumerate gaps from runs that have not happened
yet. The conference `sessions` naming clash (Convex's reserved `sessions` table vs. a
conference's own session documents) is resolved inside that example via
`TABLE_SLUG_CONFERENCE_SESSIONS` and is explicitly NOT a library gap (decision 19) — no entry for it
belongs here; none was present in this file to begin with, so there is nothing to remove. See
writer-notes.)

#### use-case-backlog.md

Append a refresh rule so the file stays current as later specs close gaps, anchored after its
feature-rank table (created in Step 2):

```md
## Refresh rule

Re-run this file's gap census whenever `inventory.md` § Gaps gains a row or a row's Disposition
changes, and whenever a new app type is proposed for `use-case-backlog.md`'s own table. Each
gap cell cites either a `planned` GitHub issue number or a `backlog.md` heading that exists at
the time of the edit — a dangling citation is a sign the backlog moved out from under this file
and needs reconciling before the next release.
```

#### launch-coordination.md

Board edit (own rows, rule 2 — no lock needed for GU's own § GU rows):

- [ ] every remaining GU row (GU-1…GU-28) set to `done` or `human`
- [ ] one § Log line appended

```md
- <ISO time> GU: stopping (rule 11). GU-1…28 done except: <list any `human` rows and what
  unblocks them, e.g. GU-13's P-024 exception grant, GU-11/17/21/25's Convex prod + Vercel
  project + env setup, GU-27's repo-public flip>. `vexcms/examples` tagged through
  `<slug>/07-v0.1.0` for all four scenarios once Step 27 completes. No locks held.
```

**Session log**

New entry at `.agent/docs/session-log/2026/11/2026-11-<dd>.log.md` (the day GU's final session
stops), § GU, following the existing per-session § <code> convention used by QP/LI/PP/LK/DEP
entries in the same directory — summarizing Steps 1–28's outcome, the four examples' final tags,
and any rows left `human`.

Verify:
- `rg -n "Flip \`vexcms/examples\` public|Bump every example" .agent/docs/product/v0.1.0-launch-plan.md` — both new rows present under § Release mechanics
- `rg -n "golden-use-cases" .agent/docs/product/v0.1.0-launch-plan.md` — § T/§ U pointer present
- every gap in `inventory.md` § Gaps not disposed to "fixed by Steps 3–4" has a matching `##` heading in `backlog.md`
- `backlog.md` has a `## Single relationships stored as a plain id` heading
- `use-case-backlog.md` has a `## Refresh rule` section
- `launch-coordination.md` § GU: no row reads `todo`/`in-progress`/`waiting`
- `rg -n "sessions" .agent/docs/product/backlog.md` finds no conference-sessions-naming entry
- `.agent/docs/session-log/2026/11/2026-11-<dd>.log.md` exists with a § GU section

## Verification

- Monorepo steps (1–4, 13, 28): `pnpm typecheck && pnpm lint && pnpm test` green; `pnpm --filter docs build` exits 0; `node scripts/verify-scaffold.mjs`, `node scripts/scaffold-smoke.mjs --bare`, `node scripts/scaffold-smoke.mjs` exit 0; `harness doctor` 0 errors.
- `pnpm --filter @vexcms/cli test` green (Step 3's passthrough tests).
- Examples repo (steps 5–27): CI `typecheck + lint` green for every folder; `golden-runthrough.md` has every row `pass` for all four scenarios; every stage tag exists (`git tag -l '*/0*'` lists 6 per example, 7 after Release).
- Coverage: every ● cell in `inventory.md` maps to at least one beat in its `playbooks/<slug>.md` that ran `pass`.

