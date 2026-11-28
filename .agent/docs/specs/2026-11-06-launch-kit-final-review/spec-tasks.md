---
status: draft
spec_id: 2026-11-06-launch-kit-final-review
touches:
  - .agent/docs/specs/2026-11-06-launch-kit-final-review/**
  - apps/www/convex/seed.ts
  - apps/test/convex/seed.ts
  - apps/www/public/launch/**
  - apps/www/public/tour/**
  - apps/test/public/tour/**
  - apps/www/e2e/routes.ts
  - .agent/docs/product/v0.1.0-launch-plan.md
  - .agent/docs/product/backlog.md
  - .agent/docs/standards/docs/voice-and-wording.md
  - .agent/docs/standards/anti-patterns.md
prompt_version: 1
---

# 2026-11-06-launch-kit-final-review — Tasks

> Launch-plan item 26 (item 17 before the 2026-11-27 re-plan), **launch kit + final review**: U (launch plan), then the posts, media and pass 2 (phase H). The big public-surface review (L) is the REVIEW spec's since 2026-11-27. `dev-spec` interview held 2026-11-06.
> High-care: the developer implements. U's agent steps produce briefs, fact sheets and checks; **every public sentence is hand-written by the developer** (HN bans generated and AI-edited text in posts and comments, `sources.md` §1.7). L is the developer's read-through; its agent steps only gather evidence.
> **Format:** a 5-day launch week, Mon–Fri. Release is the Sunday before (T-1). D1: the 0.1.0 announcement, Show HN at ~07:00 PT, LinkedIn, Convex Discord, and the dev.to + Hashnode cross-posts. D2: real-time admin + live preview, plus Product Hunt at 00:01 PT. D3: one config → schema + types. D4: RBAC + server-enforced hooks and validation. D5: create-vexcms → deployed site, plus the `launch-week` recap page. LinkedIn posts every day; DevHunt's $49 launch runs the same week.
> **Wording source:** `2026-11-06-public-presence/public-copy.md`, quoted verbatim. Nothing public names a paid tier, a paid feature, a price or a customer.
> **Binding:** `.agent/docs/product/launch-cross-spec-decisions.md` (2026-11-07). "Cross-spec decision N" refers to its table.
> **Order:** steps 1–7 can start now. Steps 8–11 wait on other specs (marked; step 8 on quality-pass steps 6–7). Steps 12–22 (L) run after every surface-changing spec has landed (items 14, 15, 16, and steps 1–11 here), directly before Release. Nothing changes after step 22 except the Release version bumps and `copy-flip.patch`.
> **Scope change (developer, 2026-11-09; spec.md Design Decision 25):** a new step 24 "Example posts" runs **before step 6** (numbered 24 so steps 6–23 keep the numbers the board, sibling specs and cross-spec decisions cite). L excludes JSDoc and TypeDoc API pages; it covers the public docs pages, www, GitHub (README, community files, issue forms, starter issues, Discussions), npm READMEs, template output, the launch posts and the release notes. L runs as a review-and-iterate loop: the developer gives feedback in the session, the agent applies it to every surface it affects and logs it in `standards/docs/voice-and-wording.md` (or `anti-patterns.md`). Step 8's shot list is owned by the demo spec; step 8's checks run against that version.
> **Contributor workflow (developer, 2026-11-10; spec.md Design Decision 26):** the `planned` issues are deleted before launch, so no post or surface links them or asks for a 👍 on one; posts link the roadmap page. CONTRIBUTING, the PR template, issue `config.yml`, SECURITY, CODE_OF_CONDUCT, `labels.yml` and the docs Development pages join L (docs in step 14, GitHub in step 19); the matrix gains "contributor flow" and "PR response window". The workflows and the `github-review` skill get findings only.
> **Scope change (developer, 2026-11-10, updated 2026-11-27; spec.md Design Decision 27):** the big public-content review (L pass 1, old steps 14–21) moves to a new **REVIEW spec** in its own session; it reads production. The example apps are out of 0.1.0; the only live demo is https://vexcms.dev/admin. This spec keeps: step 25 (kit refresh after REVIEW) → step 6 (your posts) → 7 → 8 (its own shot list again, on `apps/www` `:3030`; Design Decision 25's demo-spec list no longer applies) → 9 → 10 → **step 14, pass 2** (posts, media, the www live demo) → **step 11** (`copy-flip.patch` rebuilt from the final copy) → **step 22** (pass-2 sign-off) → 23. `l-findings.md`, `surface-review.md`, `l-prepass.md` and `l-evidence/` carry over to the REVIEW spec and are owned by it; the `voice-and-wording.md` rules apply to REVIEW unchanged. Steps 12–13 stay done (2026-11-10); steps 15–21 are removed.
> **Release blocker found while writing this spec (handed to Release, item 18; still open):** the root `release` script publishes with `--tag alpha`, and every published package has `publishConfig.tag: "alpha"`. `create-vexcms`'s `latest` is still `0.0.20`, so without a fix the post-flip `pnpm create vexcms` installs the old scaffolder. Step 23 writes the fix into the launch plan's § Release mechanics tasks at the latest. See spec.md § Handoffs.
> **Re-seeding:** `seed:reinit` (patch mode) in every verify and re-seed instruction (cross-spec decision 9).
> **Out of scope:** Reddit, X, Bluesky, Lobsters, AlternativeTo, Convex showcase outreach, a "coming from Payload" guide, a live-build video, a posts index/RSS, launch metrics reporting, Launch itself (item 19 runs `launch-kit.md`), edits to other specs, and the unstaged telemetry work.

## Step 1 — Channel rules and launch formats [agent]
Why: the plan requires the kit to come from each channel's own rules, fetched before proposing anything. Every brief and lint rule cites a row here.
Verify: `sources.md` has a URL, fetch date and status for every channel in use. Every rule a brief relies on is quoted, and anything unquotable is marked `[UNVERIFIED]`
- [x] `sources.md`: HN + Lobsters, Product Hunt + DevHunt + AlternativeTo, Reddit (sitewide + 8 subs, recorded but unused), launch-week formats (Supabase, launchweek.dev, Resend, Dub, Trigger.dev), passive channels and cross-post platforms

## Step 2 — Accounts, lead time and Convex Discord rules [dev]
Why: HN and PH both reject brand accounts. HN asks for an account that isn't used "primarily for promotion", and that history takes weeks to build. The Convex Discord rules are behind login. Starting these first hides their lead time behind the rest of the work.
Verify: the Accounts table in `launch-kit.md` lists each account (handle, created, profile complete, email verified); the Convex Discord brief records that #show-and-tell has no pinned rules and that D1 is a comment under the developer's existing post (developer, 2026-11-08)
- [x] HN account in your own name (not `vexcms`); take part in threads you'd read anyway from now until launch
- [x] Product Hunt personal profile: first + last name, photo, headline, unique non-company username, verified email
- [x] dev.to and Hashnode accounts
- [x] DevHunt: sign in with GitHub (purchase happens in step 10)
- [x] Join the Convex Discord; copy the show-and-tell channel's pinned rules into `launch-kit.md`

## Step 3 — Launch kit: channel briefs and fact sheet [agent]
Why: the developer writes every post. A per-channel brief puts the rules, limits, required links and verbatim strings in one place, so writing by hand isn't also research.
Verify: `launch-kit.md` exists with the section skeleton from spec.md. Each brief cites `sources.md` sections for its rules. The fact sheet cites a file or docs URL for every claim. `rg -ni "pro tier|agency|enterprise|maprios|\bSSO\b|audit log|co-edit|annual licen|\$[0-9]" launch-kit.md` prints nothing. Post slots hold no prose
- [ ] `launch-kit.md` skeleton: dates, accounts, canonical links, briefs, fact sheet, prepared answers, posts, submission list, schedule, launch-morning checklist, post-launch routine, lint log, feedback log
- [ ] Channel briefs: Show HN, Product Hunt, LinkedIn, Convex Discord, dev.to, Hashnode, DevHunt, Cooperpress, This Week in React, jamstack.org, awesome-nextjs
- [ ] Fact sheet: what VexCMS is, packages and versions, requirements, feature facts per launch-week day with docs links, the try-it paths (demo, quickstart)

## Step 4 — Prepared-answer fact sheets [agent]
Why: HN bans AI-edited comments, so prepared answers are facts and links the developer answers from, not paste-ready text.
Verify: one fact sheet per question. Each has facts with sources, the verbatim `public-copy.md` lines it relies on, links, and a "don't say" list. `rg -c "^### Q" launch-kit.md` prints ≥ 9
- [ ] Why not Payload / Sanity / Strapi; Convex lock-in; will it go paid; licence; solo-maintainer bus factor; migration from other CMSs
- [ ] Telemetry (M's opt-out CLI telemetry); is it production-ready; can Convex be self-hosted

## Step 5 — Schedule, submission list, launch-morning checklist, post-launch routine [agent]
Why: launch week runs from a written runbook, so nothing is decided live (Supabase's runbook, `sources.md` §4.2).
Verify: every day D-1…D5 has timed rows (PT) with channel, artifact, link target and blocked reply time. Each submission row has route, rules ref, timing and status. The launch-morning checklist has one command or URL per check. The routine covers 14 days and names where each kind of feedback lands
- [ ] Schedule table T-1 (Sun) → D5 (Fri), PT, with reply blocks. Each daily `www` publish row is one edit: publish in the admin, set the seed `vex_status` to `"published"` in both seeds, and remove that route's `draft: true` from `QUALITY_ROUTES` (cross-spec decisions 3, 8)
- [ ] Submission list: Cooperpress, This Week in React, jamstack.org PR, awesome-nextjs PR, DevHunt
- [ ] Launch-morning checklist (T-1 after Release and D1 05:30 PT): production SHAs vs the reviewed SHA, npm dist-tags and pages, GitHub `master` surfaces, the demo, monitors
- [ ] Post-launch routine: daily sweep for 14 days, plus the feedback log format

## Step 24 — Example posts [agent]
Why: the developer writes every post (decision 2). Reading strong posts from the same platform and genre first makes that faster without an agent writing a word of it.
Verify: `launch-post-examples.md` has a `## <slot id>` section for every slot in `launch-kit.md`, each with 3–5 ranked examples (link, date, numbers with a read date or `[UNVERIFIED]`, quoted opening line, why it worked) and a `### Checklist`, plus the slot's constraints from `sources.md`. Every URL in it is in `sources.md` with a fetch date. No post prose for VexCMS anywhere in it
- [ ] Examples per slot, priority: same platform + similar content (OSS dev tools, CMSs, backend frameworks, Convex ecosystem) → same platform, other dev tools → other platforms
- [ ] How-to guides: Show HN guidelines + dang's tips, Product Hunt's maker guide, Supabase's launch-week writeups, the best "how to write a launch post" guides
- [ ] `launch-post-examples.md` organized by slot; `sources.md` § 6 records every URL and fetch date

## Step 25 — Kit refresh after REVIEW [agent] [blocked: REVIEW done]
Why: the developer writes the posts against what production shows after REVIEW. The kit's facts, links and rules are re-checked first; no post prose (decision 2).
Verify: every URL in `launch-kit.md` outside the Not-yet-live table returns 200; every fact-sheet claim cites a production URL or file; the slot-emptiness scan prints no `PROSE` line
- [ ] Fact sheet (versions, requirements, shipped features + docs URLs, roadmap order incl. the vote Discussion #97, try-it paths) re-read from production, sources cited
- [ ] Canonical links and the Not-yet-live table HEAD-checked against production
- [ ] Briefs and prepared answers updated for anything REVIEW changed; the Posts-section note to the developer is current
- [ ] While you write (step 6): answer fact questions from the kit and its sources only

## Step 6 — Hand-written posts and listing copy [dev] [blocked: REVIEW done, step 25]
Why: the words are yours on every channel (decision 2). Written after REVIEW and the kit refresh, so the posts describe what production shows.
Verify: every post slot in `launch-kit.md` is filled, and step 7's lint log shows no open item
- [ ] D1: Show HN title + text; LinkedIn; Convex Discord; dev.to + Hashnode front matter and body (the www announcement body itself is public-presence step 14's)
- [ ] D2–D5: the 4 www feature posts (title, slug, excerpt, body in markdown) and 4 LinkedIn posts
- [ ] D5: `launch-week` recap page copy (page title, hero badge, hero heading/subheading, CTA heading/subheading, 5 action labels)
- [ ] Product Hunt listing: name, tagline, description, maker comment, 3 tags, pricing Free, repo link
- [ ] DevHunt listing text; Cooperpress pitch email; This Week in React note; jamstack.org `description`; awesome-nextjs line

## Step 7 — Draft lint [agent]
Why: catches what a careful writer still misses: length limits, dead or wrong links, altered verbatim strings, vote solicitation, banned terms, and planning references (AP-024). It reports and never rewrites.
Verify: the lint log in `launch-kit.md` lists every check × post with pass/finding. Proven to catch: adding "please upvote" to a scratch copy of the Show HN text produces a finding. Revert afterwards
- [ ] Run the spec's checks over every post slot; record results in the lint log
- [ ] Re-run after each round of edits until the log is clean

## Step 8 — Shared media session: feature clips, demo media, `/tour` screenshots [dev] [blocked: quality-pass steps 6–7]
Why: clips, GIFs and screenshots freeze the UI. One session after the admin and www visual fixes covers every frozen image that ships at launch (cross-spec decision 7).
Verify: 4 clips in `apps/www/public/launch/`, each H.264 MP4, ≤ 60 s, ≤ 10 MB, silent (`ffprobe` shows no audio stream), and `curl -sI http://localhost:3030/launch/<file>.mp4` returns 200. 4 `/tour` PNGs at 1280×800, with `diff -r apps/www/public/tour apps/test/public/tour` printing nothing. Public-presence step 16's own Verify passes on its media. The shot list is this step's own (spec.md step 8; Design Decision 27), recorded on `apps/www` at `:3030`
- [ ] `real-time-admin-and-live-preview.mp4`, `one-config-schema-and-types.mp4`, `access-control-hooks-validation.mp4`, `create-vexcms-to-deployed.mp4`
- [ ] Public-presence step 16's demo MP4, hero GIF and fixed-size screenshots, recorded in the same session
- [ ] The 4 `/tour` screenshots recaptured and copied into `apps/www/public/tour/` and `apps/test/public/tour/`

## Step 9 — Seed the launch-week posts and recap page [agent] [blocked: public-presence step 14 (www posts); apps/test after the telemetry commit]
Why: the posts dogfood the posts collection public-presence adds. Seeding them as drafts puts launch content in the same source of truth as every other page (P-018, P-021). The text is transcribed verbatim from the kit (decision 9).
Verify: `pnpm --filter www typecheck && pnpm --filter www test`. After `pnpm --filter www exec convex run seed:reinit` on dev, each post opens as a draft and renders in live preview; anonymous requests 404. The verbatim check (spec.md) prints `OK` for all 4 posts and the recap page. Re-running `seed:reinit` creates no duplicates. The draft audit has a dated row per route in quality-pass `findings.md`
- [ ] `apps/www/convex/seed.ts`: 4 draft posts (Plate JSON transcribed from `launch-kit.md`) and a draft `launch-week` page (Hero compact + CTA, 5 actions); no footer entry (cross-spec decision 4)
- [ ] `apps/test/convex/seed.ts`: the same documents (public-presence decision 26)
- [ ] `apps/www/e2e/routes.ts`: the 4 post routes and `/launch-week` in `QUALITY_ROUTES` with `draft: true`, if the file exists (cross-spec decision 3)
- [ ] Draft audit before pass 2 (step 14): publish on the dev deployment, run the suite with `CI` unset, record in quality-pass `findings.md`, unpublish

## Step 10 — Schedule lock and listings [dev] [blocked: REVIEW done and launch dates known]
Why: PH schedules 1–30 days ahead, DevHunt sells a specific week, and both listings need final copy. Dates are fixed once REVIEW is done and the launch week is known.
Verify: the kit's dates table is filled. The PH launch shows "Scheduled" for D2 00:01 PT. The DevHunt launch is paid for the launch week. The jamstack.org and awesome-nextjs entries are drafted in the kit, matching a recently merged entry's format
- [ ] Fix T-1 and D1–D5 dates in the kit
- [ ] Product Hunt: build the listing (logo 240×240, gallery 1270×760 from public-presence step 16), schedule for D2
- [ ] DevHunt: submit the tool and buy the $49 launch for the launch week
- [ ] jamstack.org entry file and awesome-nextjs line drafted (submitted in launch week, per the schedule)

## Step 12 — L: inventory refresh, review record, rules re-fetch [agent]
Why: surfaces kept changing in parallel specs. The inventory is re-derived from the repo, GitHub and npm right before the read, so a page added late isn't missed. The channel rules are re-fetched for the same reason. Done 2026-11-10; `surface-review.md` carries over to the REVIEW spec (Design Decision 27).
Verify: `surface-review.md` exists, records the reviewed `dev` SHA and the preview URLs for that SHA, and lists every surface the refresh commands found. The inventory includes `/privacy`, `/tour`, the admin `error.tsx` fallback, `/accessibility` (www + docs), `/brand`, the announcement and 4 feature posts, `/launch-week` and the docs `compare` page (spec.md's loop prints no `MISSING`). Each surface not in spec.md's baseline is marked `new` and has a checklist. `sources.md` has a re-fetch log row per URL (unchanged / changed + diff)
- [x] Run the refresh commands; write `surface-review.md` from the template
- [x] Re-fetch every `sources.md` URL; log changes; update the affected briefs

## Step 13 — L: evidence pre-pass [agent]
Why: puts the mechanical evidence (strings, links, manifests, settings, scaffolds) next to each checklist so the read-through is judgement, not grep. It attaches evidence only; the developer judges. Done 2026-11-10; `l-prepass.md`, `l-evidence/` and `l-findings.md` carry over to the REVIEW spec (Design Decision 27).
Verify: `l-prepass.md` has a section per matrix row and per check in spec.md, each with the command run and its full output (or an artifact path). The link check covers every URL on every surface
- [x] String sweeps, link check, packed manifests and READMEs, GitHub API dumps, `verify-scaffold.mjs --keep`, docs build, launch-kit lint re-run

## Step 14 — Pass 2: posts, media and the www live demo [dev] [blocked: steps 6–10]
Why: REVIEW reads every other public surface on production; pass 2 reads what this spec produces after it, before the copy flip is rebuilt (Design Decision 27).
Verify: every pass-2 surface has a `pass` mark or a `pass2-findings.md` id; `pass2-findings.md` § Evidence carries a channel-rule re-fetch dated within 7 days of D1
- [ ] Agent first: re-fetch the in-use channel rules (append to `sources.md` Re-fetch log, update briefs); re-run step 7's lint + link check, step 9's verbatim check and step 8's media checks; attach to `pass2-findings.md` § Evidence
- [ ] Posts and listings: every kit slot against its brief and the fact sheet; the seeded announcement, 4 feature posts and `launch-week` page via live preview on `:3030`, 390/1280 px, light/dark
- [ ] Media: the 4 clips, the 4 `/tour` PNGs, public-presence step 16's screenshots, demo MP4, GIF and PH gallery image
- [ ] The www live demo on production (https://vexcms.dev/admin), anonymous, desktop and phone: read-only everywhere, `/tour` matches today's admin
- [ ] Review-and-iterate loop: each finding applied in the session to every surface it affects and logged as a VW (or AP) entry; post wording goes back to you, never rewritten by the agent

## Step 11 — Pre-stage the release-day copy flip [dev] [blocked: step 14]
Why: Release flips the alpha wording. Built from the final copy after REVIEW and pass 2 (Design Decision 27), so step 22 reads the exact diff Release applies. The 2026-11-10 and COPY-2 builds are interim.
Verify: `git apply --check .agent/docs/specs/2026-11-06-launch-kit-final-review/copy-flip.patch` passes on the final tree. In a scratch worktree with the patch applied, the alpha rg in spec.md prints nothing outside the excluded paths
- [ ] `copy-flip.patch`: every alpha string the spec's scope command finds on a public surface of the final tree
- [ ] The announcement and the 4 feature posts stay drafts in the patch; each is published on its day (handoff to public-presence step 18)

> Steps 15–21 (the 2026-11-10 L steps: READMEs/npm, www, live demo, templates, GitHub, launch kit + release notes, consistency matrix) are removed: the REVIEW spec covers them (Design Decision 27). Posts, media and the www live demo are pass 2 (step 14).

## Step 22 — Pass-2 sign-off [dev] [blocked: step 11]
Why: nothing reaches launch unread. Pass 2's findings are applied or deferred; the rebuilt patch is read line by line.
Verify: `pass2-findings.md` has no open `blocker`, its § Sign-off carries the final tree SHA, and `git apply --check` on `copy-flip.patch` exits 0 on that SHA
- [ ] Re-check every applied pass-2 finding's surface
- [ ] Read the rebuilt `copy-flip.patch` line by line, including the agent-written replacement copy
- [ ] Sign off in `pass2-findings.md` with the final tree SHA

## Step 23 — Launch plan and backlog updates [agent]
Why: cross-spec decision 8. Each spec's final step edits `v0.1.0-launch-plan.md` and `backlog.md` directly; there is no proposal file. Handoffs to sibling specs were applied through the 2026-11-07 review.
Verify: `rg -n "Publish 0\.1\.0 to npm" .agent/docs/product/v0.1.0-launch-plan.md` prints one line in § Release mechanics. Item 26 and the U tasks are ticked with evidence. Every `backlog` row in `pass2-findings.md` and every deferred channel has its `backlog.md` entry. `harness doctor` clean
- [x] `v0.1.0-launch-plan.md` § Release mechanics: the npm `latest` dist-tag task (added 2026-11-10, with the copy-flip apply step)
- [ ] `v0.1.0-launch-plan.md`: item 26 and § U tasks (launch-kit path) ticked with evidence; § L tasks are the REVIEW spec's
- [ ] `backlog.md`: deferred channels and extras, plus one entry per `backlog` row in `pass2-findings.md`
