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

# 2026-11-09-golden-use-cases — Tasks

Board session **GU** (`.agent/docs/product/launch-coordination.md` § GU). Row GU-n = Step n.
Steps 1–4 run in the monorepo now (no dev servers); Steps 3–4 land before alpha.35 is cut. Every step from 6 on runs in the examples
clone at `~/Documents/Projects/vex-examples` against the published `@vexcms/*@0.1.0-alpha.35`.
A step marked **needs developer exception** starts `vex dev`, `next dev` or the Convex CLI, which
P-024 / board rule 8 forbid. It stays `human` on the board until the developer grants the scoped
exception (Design Decision 14).

## Step 1 — Board section, locks, human queue [agent]
Why: board rule 2 — GU edits only its own rows; the `media-session.md` rewrite edits an LK-owned file and needs a lock row.
Verify: `launch-coordination.md` has § GU with rows GU-1…GU-28, a § Locks row for the two LK files, the human-queue items and one § Log line; no other session's row changed (`git diff` shows additions only outside § GU)
- [x] § GU table (GU-1…GU-28, "Waits for" per this file)
- [x] § Locks row: `launch-kit-final-review/media-session.md` + `launch-kit.md`
- [x] § Human queue: private repo + clone, Convex/Vercel accounts, alpha.35 publish order, P-024 exception grant
- [x] § Log: heads-up to LK (LK-8 waits for GU-13)

## Step 2 — Use-case backlog [agent]
Why: the developer keeps backlogged app types on file and ranks features by how many common project types each one unblocks.
Verify: every gap cell in `use-case-backlog.md` cites a `planned` issue number or a `backlog.md` heading that exists; the rank table's counts equal a recount of the matrix; `backlog.md` links the file
- [x] `.agent/docs/product/use-case-backlog.md` — golden scenarios, backlogged app types × gaps, feature rank
- [x] `.agent/docs/product/backlog.md` — one pointer entry (board lock)

## Step 3 — `vex deploy` flag passthrough + deployment guide [agent]
Why: `vex deploy` parses no flags (it even ignores `--cwd`) and kills `convex deploy` after 120 s, so Convex's own Vercel recipe (`--cmd`) can't run through it; no docs page covers Convex prod + Vercel production; the access-control guide's relationship owner examples never match.
Waits for: — (lands before alpha.35, like Step 4)
Verify: `pnpm --filter @vexcms/cli test` green, and fails when the interim-push `--cmd` strip is removed; `pnpm --filter docs build` exits 0; `/guides/deployment/` in the sidebar after Quickstart; every command in the guide exists
- [x] `packages/cli/src/index.ts`, `packages/cli/src/commands/deploy.ts`, `packages/cli/src/lib/convexProcess.ts` + colocated tests
- [x] `.changeset/cli-deploy-flag-passthrough.md` (`patch`, P-025)
- [x] `apps/docs/src/content/docs/guides/deployment.mdx` (build command `pnpm vex:deploy --cmd 'pnpm build'`, optional "Closing sign-up")
- [x] `apps/docs/astro.config.mjs` — sidebar entry (board lock)
- [x] `apps/docs/src/content/docs/guides/quickstart.mdx` — "Next steps" link
- [x] `apps/docs/src/content/docs/guides/access-control.mdx` — relationship owner examples compare `[user._id]`

## Step 4 — Templates: `vex:deploy` script + README Deployment [agent]
Why: the scaffold README says `npx convex deploy` and ships no `vex:deploy` script; the guide and the templates must agree before alpha.35 is cut.
Waits for: DEP (`2026-11-07-pre-launch-dependency-upgrades`) done — both edit `templates/base-nextjs/package.json`. alpha.35 is published after this step.
Verify: `node scripts/verify-scaffold.mjs`, `node scripts/scaffold-smoke.mjs --bare`, `node scripts/scaffold-smoke.mjs` exit 0; both scaffolds' `package.json` carry `"vex:deploy": "vex deploy"`; `rg -n "npx convex deploy" packages/create-vexcms` prints nothing
- [x] `packages/create-vexcms/templates/base-nextjs/package.json` — `vex:deploy`
- [x] `packages/create-vexcms/templates/base-nextjs/README.md` — § Deployment
- [x] `packages/create-vexcms/README.md` — scripts table + deployment pointer
- [x] `.changeset/create-vexcms-deploy-script.md` (`patch`, P-025)

## Step 5 — Examples repo skeleton [agent]
Why: one private, clonable home for the four scenarios, with CI that catches alpha bumps.
Waits for: human — private `ianyimi/vex-examples` created and cloned to `~/Documents/Projects/vex-examples`.
Verify: `actionlint .github/workflows/ci.yml` clean; the first push runs `ci` green with an empty matrix
- [x] `README.md`, `LICENSE` (Apache-2.0), `NOTICE`, `.gitignore`, `.github/workflows/ci.yml`

## Step 6 — Magazine 01: scaffold on alpha.35 [agent] — needs developer exception
Why: scenario 1 starts exactly where a stranger starts; this is the D5 clip's first half.
Waits for: GU-5, alpha.35 published, exception granted.
Verify: run-through rows "scaffold", "vex dev generates", "first sign-up is admin" pass; tag `magazine/01-scaffold` pushed
- [x] `pnpm create vexcms@alpha magazine --bare` (answers in spec), port 3200, Convex project `vex-example-magazine`
- [x] env on the deployment; `pnpm vex:dev` + `pnpm dev`; first sign-up

## Step 7 — Magazine 02: collections and fields [dev] — needs developer exception
Why: the D3 story — one config becomes the Convex schema, the types and the admin.
Verify: `pnpm typecheck` 0; `vex dev` regenerates `convex/vex.schema.ts` + `src/vex.types.ts` with `Article`/`Category` and the extended user type; admin lists the three collections; tag `magazine/02-collections`
- [x] `src/vexcms/collections/{categories,articles}.ts` + `index.ts`, registered in `src/vex.config.ts`; byline fields (slug, bio, avatar) on the user collection; `articles.author` a single relationship to users
- [x] `@vexcms/richtext-plate` added; `editor` set in `src/vex.config.ts`
- [x] drafts + autosave + live preview on `articles`

## Step 8 — Magazine 03: access, hooks, validation, slots [dev] — needs developer exception
Why: the D4 story — authors (user accounts with byline fields) edit only their own drafts, editors publish, the server rejects a duplicate slug.
Verify: run-through rows "author cannot edit another author's article", "author cannot publish", "featured is editor-only", "duplicate slug rejected server-side", "Copy link header action" pass; tag `magazine/03-access`
- [x] `src/auth/access.ts` — `editor`, `author` roles; owner rule `indexedOwnerCheck(articles, "author")`; `featured` field map; anonymous readers never see user `email`
- [x] Better Auth options: `emailAndPassword.disableSignUp` when Convex env `AUTH_DISABLE_SIGN_UP` is `"true"`
- [x] `articles` hooks: `beforeChange` (slug, reading time), `validate()` (slug uniqueness)
- [x] `edit.header.actions` contribution

## Step 9 — Magazine 04: seed, reset, demo accounts [agent] — needs developer exception
Why: every take starts from the same content and the same three accounts.
Verify: `pnpm seed` on an empty deployment creates the seeded documents; `pnpm seed:reinit` restores an edited article; `pnpm seed:reset` removes a demo-created article and restores the start state; `pnpm demo:accounts` creates admin/editor/author with the right roles; tag `magazine/04-seed`
- [ ] `convex/seed.ts` (`init`, `reinit`, `reset`), `scripts/create-demo-accounts.mjs`, `package.json` scripts, `.env.example`

## Step 10 — Magazine 05: front end, live preview, richtext render [agent] — needs developer exception
Why: the D2 story — edit an article, the real route updates before save; an unpublished draft previews through Draft Mode.
Verify: `pnpm build` 0 with `/`, `/articles/[slug]` prerendered; run-through rows "live preview updates without reload", "draft-only article previews", "sitemap lists published only", "revalidate on publish" pass; tag `magazine/05-front-end`
- [x] routes `/`, `/articles/[slug]`, `/authors/[slug]`, `/categories/[slug]`, sitemap, robots, revalidate, draft-mode
- [x] `RichText` render, `VexImage`

## Step 11 — Magazine 06: Convex prod + Vercel production [agent] — needs developer exception
Why: the D5 story ends on a production URL that stays live; this step also proves the Step 3 guide by checking the deployment against it.
Waits for: human — `vex-example-magazine` Convex prod deployment, Vercel project `vexcms-example-magazine` with build command `pnpm vex:deploy --cmd 'pnpm build'` and prod env, first sign-up done (admin).
Verify: Vercel build log shows `vex deploy` forwarding `--cmd`; `https://<prod>/` 200 with seeded articles; demo accounts sign in on prod; `POST /api/auth/sign-up/email` on prod rejected after `AUTH_DISABLE_SIGN_UP=true`; `magazine/README.md` links the live site and `/admin`; every deviation from `guides/deployment.mdx` fixed in the monorepo; tag `magazine/06-deployed`
- [ ] `pnpm seed` + `pnpm demo:accounts` against prod; `npx convex env set AUTH_DISABLE_SIGN_UP true --prod`
- [ ] `magazine/README.md` — Live demo line

## Step 12 — Magazine playbook + run-through [agent] — needs developer exception
Why: the scripts must be rehearsable as written; a beat that can't be run is a false claim.
Verify: `golden-runthrough.md` § magazine has every 5-min and 15-min beat and every shot executed `pass`; `seed:reset` between scripts restores the start state; examples CI green
- [x] `.agent/docs/specs/2026-11-09-golden-use-cases/playbooks/magazine.md`
- [x] `.agent/docs/specs/2026-11-09-golden-use-cases/golden-runthrough.md` § magazine

## Step 13 — `media-session.md` rewrite + D5 fact-sheet link [agent]
Why: the launch clips, demo take and PH hero come from scenario 1; LK owns the file, so GU takes the § Locks row.
Waits for: GU-12. LK-8 waits for this row.
Verify: every clip row's "From" cell names a magazine route or command on :3200; `/tour` and brand-screenshot rows unchanged; `launch-kit.md` D5 "Docs:" line carries `https://docs.vexcms.dev/guides/deployment/`; lock released
- [ ] `.agent/docs/specs/2026-11-06-launch-kit-final-review/media-session.md`
- [ ] `.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md` — D5 fact-sheet line

## Step 14 — Real estate 01–02: scaffold, collections, fields [dev] — needs developer exception
Why: the broadest field-system scenario: tabs, rows, conditional sale/rent fields, masks, galleries.
Waits for: GU-12 (mirrors magazine's patterns).
Verify: `pnpm typecheck` 0; admin renders the listing form's tabs and switches fields on `listingType`; tags `real-estate/01-scaffold`, `real-estate/02-collections`
- [x] scaffold `--bare`, port 3210, Convex project `vex-example-real-estate`
- [x] `src/vexcms/collections/{agents,listings}.ts`, registered in `src/vex.config.ts`

## Step 15 — Real estate 03: access, hooks, list views, bulk action [dev] — needs developer exception
Why: the D4 alternate — agents own listings, commission is broker-only, a shared saved view and a "Mark sold" bulk action.
Verify: run-through rows "agent sees only own listings in 'My listings'", "commission hidden from agent", "MLS id unique", "Mark sold bulk action", "agent cannot run Mark sold on others' listings" pass; tag `real-estate/03-access`
- [x] `src/auth/access.ts`, `listings` hooks, `admin.views`, `list.bulkActions` contribution + custom action
- [x] Better Auth options: `emailAndPassword.disableSignUp` when Convex env `AUTH_DISABLE_SIGN_UP` is `"true"`

## Step 16 — Real estate 04–05: seed and front end [agent] — needs developer exception
Why: a searchable listings site with galleries; the telemetry beat lives in this scenario's 15-min script.
Verify: `pnpm build` 0; `/listings?q=` search returns seeded matches; seed/reinit/reset/accounts pass; tags `real-estate/04-seed`, `real-estate/05-front-end`
- [x] `convex/seed.ts`, accounts script, routes `/`, `/listings`, `/listings/[slug]`, `/agents/[slug]`

## Step 17 — Real estate 06: deploy, playbook, run-through [agent] — needs developer exception
Why: same production path as magazine; the playbook proves every beat.
Waits for: human — `vex-example-real-estate` Convex prod deployment, Vercel project `vexcms-example-real-estate` (build command `pnpm vex:deploy --cmd 'pnpm build'`) and prod env, first sign-up done (admin).
Verify: prod URL 200; build log shows `--cmd` forwarded; prod sign-up rejected after `AUTH_DISABLE_SIGN_UP=true`; `real-estate/README.md` links the live site; `golden-runthrough.md` § real-estate all `pass`; tag `real-estate/06-deployed`
- [ ] prod seed + `demo:accounts` + sign-up lockdown; README live link; `playbooks/real-estate.md`; run-through

## Step 18 — Conference 01–02: scaffold, collections, global, blocks, OAuth [dev] — needs developer exception
Why: starts from the marketing template; adds speakers/sessions, an event global and GitHub sign-in.
Waits for: GU-12; human — GitHub OAuth app (dev callback).
Verify: `pnpm typecheck` 0; admin shows Speakers, Sessions, Event settings; GitHub sign-in reaches `/admin`; tags `conference/01-scaffold`, `conference/02-collections`
- [x] scaffold (marketing), port 3220, Convex project `vex-example-conference`, GitHub selected at the OAuth prompt
- [x] `src/vexcms/collections/{speakers,sessions}.ts`, `src/vexcms/globals/eventSettings.ts`, a `ScheduleEmbed` block, all registered in `src/vex.config.ts`

## Step 19 — Conference 03: access, hooks, validation [dev] — needs developer exception
Why: the D3/D4 alternate — a cross-document `validate()` rejects a room/slot clash; triggers keep counters; the public admin is read-only via `anonRole`.
Verify: run-through rows "room/slot clash rejected", "speaker sessionCount follows create/delete", "speaker with sessions cannot be deleted", "anonymous /admin read-only" pass; tag `conference/03-access`
- [x] `src/auth/access.ts` (`anonRole`), `sessions`/`speakers` hooks
- [x] Better Auth options: `emailAndPassword.disableSignUp` when Convex env `AUTH_DISABLE_SIGN_UP` is `"true"`

## Step 20 — Conference 04–05: seed, front end, test kit [agent] — needs developer exception
Why: schedule and session pages with live preview; the exported test kit run against this config.
Verify: `pnpm build` 0; `pnpm test` runs the kit suite green; seed/reinit/reset/accounts pass; tags `conference/04-seed`, `conference/05-front-end`
- [x] `convex/seed.ts` additions, routes `/schedule`, `/sessions/[slug]`, `/speakers/[slug]`, `vitest.config.ts` + kit test

## Step 21 — Conference 06: deploy, playbook, run-through [agent] — needs developer exception
Waits for: human — `vex-example-conference` Convex prod deployment, Vercel project `vexcms-example-conference` (build command `pnpm vex:deploy --cmd 'pnpm build'`) and prod env, GitHub OAuth prod callback, first sign-up done (admin).
Why: production path + rehearsable scripts.
Verify: prod URL 200; build log shows `--cmd` forwarded; prod sign-up rejected after `AUTH_DISABLE_SIGN_UP=true`; `conference/README.md` links the live site; GitHub sign-in on prod; `golden-runthrough.md` § conference all `pass`; tag `conference/06-deployed`
- [ ] prod seed + `demo:accounts` + sign-up lockdown; README live link; `playbooks/conference.md`; run-through

## Step 22 — Restaurant 01–02: scaffold, collections, hours global, brand themes [dev] — needs developer exception
Why: the D2 alternate — menus as arrays of groups, brand themes, a global whose preview updates the banner live.
Waits for: GU-12.
Verify: `pnpm typecheck` 0; admin shows Locations, Menus, Hours & banner; tags `restaurant/01-scaffold`, `restaurant/02-collections`
- [x] scaffold (marketing), port 3230, Convex project `vex-example-restaurant`
- [x] `src/vexcms/collections/{locations,menus}.ts`, `src/vexcms/globals/hours.ts`, registered in `src/vex.config.ts`

## Step 23 — Restaurant 03: access, Input override, duplicate [dev] — needs developer exception
Why: the admin-customization story: a price `Input` override with a live formatted preview; duplicate a menu for a new season.
Verify: run-through rows "price override renders", "duplicate menu", "staff role cannot edit hours" pass; tag `restaurant/03-access`
- [x] `src/auth/access.ts`, `src/vexcms/admin/PriceInput.tsx`, `menus` override wiring
- [x] Better Auth options: `emailAndPassword.disableSignUp` when Convex env `AUTH_DISABLE_SIGN_UP` is `"true"`

## Step 24 — Restaurant 04–05: seed and front end [agent] — needs developer exception
Why: menu pages per location, the hours banner from the global, per-brand theme CSS.
Verify: `pnpm build` 0; live preview of a menu and of the hours global updates without reload; seed/reinit/reset/accounts pass; tags `restaurant/04-seed`, `restaurant/05-front-end`
- [x] `convex/seed.ts` additions, routes `/locations/[slug]`, `/locations/[slug]/menu`

## Step 25 — Restaurant 06: deploy, playbook, run-through [agent] — needs developer exception
Waits for: human — `vex-example-restaurant` Convex prod deployment, Vercel project `vexcms-example-restaurant` (build command `pnpm vex:deploy --cmd 'pnpm build'`) and prod env, first sign-up done (admin).
Why: production path + rehearsable scripts.
Verify: prod URL 200; build log shows `--cmd` forwarded; prod sign-up rejected after `AUTH_DISABLE_SIGN_UP=true`; `restaurant/README.md` links the live site; `golden-runthrough.md` § restaurant all `pass`; tag `restaurant/06-deployed`
- [ ] prod seed + `demo:accounts` + sign-up lockdown; README live link; `playbooks/restaurant.md`; run-through

## Step 26 — Live deployments: README links + health check [agent]
Why: decision 6 — the four deployments stay live and every README links them; a scheduled check catches one going down.
Waits for: GU-11, GU-17, GU-21, GU-25.
Verify: root README "Live demos" table and each `<slug>/README.md` carry the live site + `/admin` URLs; `curl -s -o /dev/null -w '%{http_code}'` prints 200 for each; `live-check` workflow run green via `workflow_dispatch`, and fails when one URL is pointed at a 404
- [ ] `README.md`, `<slug>/README.md` × 4, `.github/workflows/live-check.yml`

## Step 27 — Release: repo public, 0.1.0 bump, retag [agent] — needs developer exception
Why: posts link a public repo on 0.1.0, not a private one on an alpha.
Waits for: Release mechanics (`changeset pre exit` + publish); human — flip `ianyimi/vex-examples` public.
Verify: per example `pnpm install && pnpm vex:generate && pnpm typecheck && pnpm lint` 0 on `0.1.0`; CI green; tags moved to the bump commit's descendants (`<slug>/07-v0.1.0`)
- [ ] bump exact pins, regenerate, verify, tag

## Step 28 — Bookkeeping [agent]
Why: cross-spec decision 8 — each spec's final step edits the launch plan and backlog itself.
Verify: launch plan § Release mechanics has the examples flip + bump rows; `backlog.md` and `use-case-backlog.md` carry every gap found in the run-throughs; every GU row `done` or `human`; `harness tasks` updated
- [ ] `v0.1.0-launch-plan.md`, `backlog.md`, `use-case-backlog.md`, board, session log
