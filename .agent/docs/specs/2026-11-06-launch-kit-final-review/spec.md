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
prompt_version: 1
---

# 2026-11-06-launch-kit-final-review — Spec

## Overview

This spec covers launch-plan item 17: U (the launch plan), then L (the final public-surface review). U turns the launch into a written runbook. `launch-kit.md` holds a brief per channel, a fact sheet, prepared-answer fact sheets, the posts, the submission list, the schedule, a launch-morning checklist and a post-launch routine. U also adds four launch-week posts, their clips and a recap page to `apps/www`. L is the developer's read of every public surface directly before Release. Hard constraint 9 ("N–V before L; L directly before Release") is why the two share a spec, with L last.

The research ran first (`sources.md`, every URL fetched 2026-11-06), and it changed the shape of U. HN now bans generated and AI-edited text in posts and comments, and several channels have similar rules. So agents prepare facts, links and checks, and the developer writes every public sentence. The surfaces are still moving in three parallel specs (`2026-11-06-quality-pass`, `2026-11-06-launch-infrastructure`, `2026-11-06-public-presence`). L therefore opens by re-deriving the surface inventory from the repo, GitHub and npm instead of trusting the baseline written here.

`.agent/docs/product/launch-cross-spec-decisions.md` (2026-11-07) is binding for this spec and its three siblings; "cross-spec decision N" below refers to its table. It adopted this spec's D1 announcement timing (cross-spec decision 1) and `copy-flip.patch` (cross-spec decision 2).

## Design Decisions

1. **One spec, U then L, with L the last work before Release.** Why: hard constraint 9. U adds www surfaces (posts, recap page, clips) and launch drafts that L must read, and anything changed after L reaches launch unreviewed.
2. **The developer hand-writes every public sentence. Agents write briefs, fact sheets and lint, never post prose.** Why: HN, "Please don't put generated text in HN posts" and "Don't post generated text or AI-edited text"; dang's tips ask for no LLM "not even a tiny bit, including to edit or spruce it up" (`sources.md` §1.7). The same rule everywhere keeps one voice, and readers who click from HN to the other posts find the same author. The interview chose this over a split where agents draft the lower-risk channels.
3. **Prepared answers are fact sheets: facts with sources, verbatim `public-copy.md` lines, links, and a "don't say" list.** Why: replies on HN fall under the same AI-text rule. A fact sheet makes answering fast without making the answer generated.
4. **A 5-day launch week, Mon–Fri, with Release on the Sunday before (T-1).**
   - D1: the announcement, Show HN, LinkedIn, Convex Discord and the cross-posts.
   - D2: real-time admin + live preview, with Product Hunt.
   - D3: one config → schema + end-to-end types.
   - D4: RBAC + server-enforced hooks and validation.
   - D5: create-vexcms → deployed site, plus the recap page.

   Why:
   - launchweek.dev says a week "doesn't have to last 5 days" and lists solo makers (`sources.md` §4.3). Dub's day-1 impressions (155K) dwarf day 3 (2K), so the broadest post goes first (§4.3c).
   - HN and PH get separate days so each thread gets the developer's full attention.
   - Supabase ships nothing on launch days (§4.2); releasing the day before means a broken publish surfaces before any post is live.
5. **Show HN links to https://vexcms.dev, at ~07:00 PT on D1.** The text goes in the submission, or in the first comment if it doesn't show. Why: Show HN wants something people can try "without barriers such as signups" (`sources.md` §1.1). The read-only `/admin` demo is one click from the home page, whereas the repo needs a Convex account to try. The posting time is when the developer can stay in the thread; no primary source sets one (§1.3 ranks on points over time). "Launch HN" is YC-only (§1.4).
6. **Channels: Show HN, Product Hunt, LinkedIn, Convex Discord, dev.to + Hashnode (the announcement only), and DevHunt's $49 launch.** Passive submissions: Cooperpress, This Week in React, jamstack.org and awesome-nextjs. Why: the developer chose these.
   - Reddit is out: the developer has no account with history, and the sub rules require one (r/javascript "should not constitute a majority of your contributions", r/opensource "<10%", `sources.md` §3.4).
   - Lobsters is out: it needs an invited account older than 70 days to post self-promotion (§1.5).
   - X and Bluesky aren't used. AlternativeTo's free queue may never be reviewed (§2.11).

   The rules for the unused channels stay in `sources.md` for a later plan.
7. **Every launch record lives in this spec folder:** `launch-kit.md`, `surface-review.md`, `l-prepass.md`, `l-findings.md`, `copy-flip.patch`. Plan and backlog updates go straight into `v0.1.0-launch-plan.md` and `backlog.md` (step 23, cross-spec decision 8); there is no proposal file. Why: this mirrors the sibling specs' records (`public-copy.md`, `live-proof.md`, `operations.md`). Under cross-spec decision 10 (option A), the whole `.agent/` moves out of the public repo to the central `../agents` link. The `.agent` symlink keeps every `.agent/docs/specs/…` path in this spec valid, and the drafts are no longer public before launch.
8. **The four feature posts are `posts` documents on www, seeded as drafts in both seeds.** Each is published from the admin on its day. In one edit the same day, its seed `vex_status` changes to `"published"` and its route loses `draft: true` in `QUALITY_ROUTES` (decision 22). Why:
   - Public-presence step 14 adds the `posts` collection and seeds the announcement this way. These posts mirror that block's locator and insert/patch/skip handling.
   - P-021 makes the seed the source of truth, and `seed:reinit` (cross-spec decision 9, patch mode) rewrites every seeded field. Without the same-day seed edit, the next re-seed would un-publish a post.
   - `apps/test` gets the same documents (public-presence decision 26).
9. **The developer writes post bodies as markdown in `launch-kit.md`; an agent transcribes them verbatim into Plate JSON.** Verify reads the seeded documents back with `convex data` and diffs their text against the kit. Why: the text stays the developer's word for word (decision 2), and nobody hand-writes Plate JSON.
10. **The recap page is a seeded `launch-week` page, a draft until D5, built from a compact Hero + a CTA with five actions.** During the week, each post links the earlier ones in the developer's own text. Why:
    - It mirrors public-presence's `/brand` page, the closest existing system (a page of links built from existing blocks, P-018).
    - It is the posts index public-presence left to U.
    - Publishing once on D5 means the page never links a post that is still a draft. Resend and Dub both close their weeks with a recap (`sources.md` §4.3b–c).
    - **No footer entry.** Neither the recap page nor anything else in this spec adds a www footer or `socialLinks` entry. If one is ever added, it goes at its position in `2026-11-06-public-presence/public-copy.md` § Footer (cross-spec decision 4), the one canonical ordered list.
11. **Clips are silent H.264 MP4s, ≤ 60 s and ≤ 10 MB, in `apps/www/public/launch/`.** Posts link them, and LinkedIn gets them as native uploads. Why: same-origin files fall under the quality pass's CSP `'self'` and need no third-party embed or privacy-page entry. With no audio there's no caption track to author; the post text describes what each clip shows. The 10 MB cap matches public-presence's media budget.
12. **The announcement and each feature post carry the `public-copy.md` Funding line and link the `planned` issues.** Why: the plan asks for the community-funding ask in every post, and the 👍 on `planned` issues is the public roadmap's demand signal.
13. **Public-presence step 18's release-day copy flip is pre-staged as `copy-flip.patch` and reviewed inside L.** Its scope is every alpha string on any inventoried public surface. Release applies it unchanged. Why: nothing may change after L unreviewed (hard constraint 9). Step 18's own `rg` covers four paths, but the alpha strings also live in package READMEs, the Hero block defaults and the templates.
14. **L reads the pre-Release state.** That means the Vercel previews of the reviewed `dev` SHA, the branch files, packed tarballs and live GitHub settings. The kit's launch-morning checklist confirms that live matches what was reviewed. Why: www and docs production deploy from `master` (GitHub deployments "Production – vex-www" at `1d07d23`, the dev → master merge of PR #50); npm shows `0.1.0-alpha.29` until publish; GitHub reads issue forms and community files from `master`. `git diff --stat <reviewed-sha>..origin/master` showing only the Release version bumps and the patch's files is the live = reviewed proof.
15. **L's first step re-derives the surface inventory with commands, and anything not in this spec's baseline is flagged `new` and given a checklist.** Why: three parallel specs are still adding pages.
16. **An agent pre-pass attaches evidence and the developer judges.** The evidence is string sweeps, a link check, packed manifests and READMEs, GitHub API dumps, scaffolds and the docs build. Why: the developer reads every surface, and the evidence turns the mechanical half (versions, links, verbatim strings) into lookups instead of searches.
17. **Findings are either `blocker` or `backlog`.** Blockers are cross-surface contradictions, false or unsupported claims, broken launch-path links or routes, any named paid tier, price or customer, and alpha wording outside the patch. They are fixed and re-checked before sign-off. Everything else becomes a `backlog.md` entry, written by step 23 (cross-spec decision 8). Why: the plan says "Contradictions between surfaces are launch blockers; anything else structural goes to `backlog.md`".
18. **Three questions join the plan's six prepared answers: telemetry, production readiness and Convex self-hosting.** Why: M ships opt-out CLI telemetry, the most predictable objection on HN. "Is it production-ready?" is the obvious question at 0.1.0. The lock-in answer depends on whether Convex can be self-hosted.
19. **Channel rules are re-fetched when L starts.** Why: HN's rules changed during 2026 (dang's edit is dated 2026-03-28). A rule fetched weeks before launch can be stale on the day.
20. **No new permanent scripts.** Lint, the verbatim check and the link check are commands and throwaway scripts in this spec, each with a negative test (AP-013). Why: the kit is single-use, and a committed script nothing else calls is dead weight.
21. **The schedule is in US Pacific time.** Why: the developer's timezone, and PH's day starts at 00:01 PT (`sources.md` §2.2).
22. **The 4 feature posts and `/launch-week` enter `QUALITY_ROUTES` in `apps/www/e2e/routes.ts` with `draft: true` (step 9).** CI skips drafts. Before L, each is audited locally: publish on the dev deployment, run the suite with `CI` unset, record the result in quality-pass `findings.md`, unpublish. Each launch-day publish removes its route's `draft` flag in the same edit as the seed `vex_status` flip (decision 8). Why: cross-spec decision 3. The routes are drafts in production until their day, so CI can't reach them, but they still get the same audit as every other www route before L reads them.
23. **`launch-week` and every post document stay out of the `marketing-site` template.** Why: cross-spec decision 6 excludes everything vexcms-specific from the template: the `posts` collection, `/posts/[slug]`, the `privacy`, `accessibility`, `brand` and `launch-week` pages, `/tour`, every post document, the vexcms-only footer links, and the Sponsors `socialLinks` entry. L step 18 checks the scaffold against that list.
24. **Step 8 is the shared media session.** It records this spec's 4 clips, public-presence step 16's demo media and the recaptured `/tour` screenshots, after quality-pass steps 6–7. Why: cross-spec decision 7. One session after the visual fixes means no frozen image ships a pre-fix screen, and `/tour` stays in step with the clips.

## Out of Scope

- Reddit, X, Bluesky, Lobsters, AlternativeTo, the Convex Templates gallery / Stack outreach, awesome-react, Bytes: recorded in `sources.md`, added to `backlog.md` in step 23.
- A "coming from Payload" guide and a scaffold-to-deployed live-build video: backlog (step 23).
- A posts index route, RSS, tags or authors: the recap page covers launch week (decision 10).
- Launch metrics reporting (traffic, downloads, stars). P's analytics and M's telemetry exist; reading them isn't part of this spec.
- Launch itself (item 19): it runs `launch-kit.md`. Release mechanics (item 18): unchanged, except applying `copy-flip.patch` and the announcement handoff below.
- Fixing L's non-blocker findings: recorded as `backlog.md` entries only (step 23).
- Editing other specs. Step 23 edits the launch plan and `backlog.md` directly (cross-spec decision 8).
- The unstaged telemetry work in `packages/cli`, `packages/telemetry`, `packages/create-vexcms`, `apps/test` and `scripts/`. Steps that edit `apps/test` wait for it to be committed.

## Handoffs

Cross-spec decisions applied this spec's handoffs to public-presence and the quality pass on 2026-11-07, through the review. Only the Release handoff stays open. Step 23 writes it into the launch plan's § Release mechanics tasks at the latest.

**`2026-11-06-public-presence`** — applied 2026-11-07

- **Step 18 (release-day copy flip).** Applied 2026-11-07 (cross-spec decisions 1, 2). The flip is the reviewed `copy-flip.patch` from this spec's step 11, applied unchanged at Release. Its scope is wider than step 18's `rg` (decision 13). The announcement `vex_status: "published"` change moves from Release to D1 morning, because Release is the day before launch (decision 4).
- **Step 16 (demo media).** Applied 2026-11-07 (cross-spec decision 7). Its media is recorded in this spec's step 8, the shared media session. Product Hunt needs a 240×240 logo (`sources.md` §2.3) beside the 1270×760 gallery screenshot step 16 already makes. Export `vexcms-mark` at 240 px into `apps/www/public/brand/`.
- **Backlog entry "Posts index page".** Applied 2026-11-07. Resolved by the `launch-week` recap page (decision 10). Drop it, or keep it only for the post-launch posts cadence.

**Release mechanics (launch-plan item 18) — a launch blocker found while writing this spec** — open

- 0.1.0 must publish to npm's `latest` dist-tag. Today the root `package.json` `release` script runs `pnpm publish -r --no-git-checks --tag alpha`, and all 8 published `package.json`s carry `publishConfig.tag: "alpha"`. `changeset pre exit` changes neither.
- `npm view create-vexcms dist-tags` prints `{"latest":"0.0.20","alpha":"0.1.0-alpha.29"}` (2026-11-06). If 0.1.0 also lands on `alpha`, the post-flip `pnpm create vexcms` installs the 0.0.20 scaffolder.
- Release has to drop `--tag alpha` and the `publishConfig.tag` fields (or move `latest` with `npm dist-tag add <pkg>@0.1.0 latest` for each of the 8 packages). This spec doesn't edit them: `packages/cli` and `packages/create-vexcms` carry unstaged telemetry work, and the change belongs to Release.
- The launch-morning checklist stops the launch if `latest` isn't `0.1.0`. L's matrix row "version + npm dist-tag" records the planned fix as reviewed.
- Step 23 adds the task to the launch plan's § Release mechanics task list at the latest; anyone working on Release mechanics earlier writes it in then.

**`2026-11-06-quality-pass`** — applied 2026-11-07

- **Step 2 route list.** Applied 2026-11-07 (cross-spec decision 3). This spec's step 9 adds `/posts/real-time-admin-and-live-preview`, `/posts/one-config-schema-and-types`, `/posts/access-control-hooks-validation`, `/posts/create-vexcms-to-deployed` and `/launch-week` to `QUALITY_ROUTES` with `draft: true`, and runs the draft audit before L (decision 22).
- **Step 8 CSP.** Applied 2026-11-07. `/launch/*.mp4` is same-origin. If a `media-src` directive is set, it must include `'self'`.

## Implementation

### Step 1 — Channel rules and launch formats [agent]

Done while writing this spec. `sources.md` records every fetched URL with its date, status and verbatim quotes. Reddit's `about/rules.json` and old.reddit.com were bot-walled for plain fetches, so §3.4 was read from the rendered subreddit pages in a logged-out browser. HN's generated-text rule was re-fetched and quoted by the spec author (§1.7). Bluesky's limit comes from the AT Protocol lexicon (§5.18) instead of the secondary sources.

- [x] `.agent/docs/specs/2026-11-06-launch-kit-final-review/sources.md`

Verify: `rg -c "^Fetched: 2026-11-06" .agent/docs/specs/2026-11-06-launch-kit-final-review/sources.md` prints ≥ 40 (49 today). `rg -c "^Status:" .agent/docs/specs/2026-11-06-launch-kit-final-review/sources.md` is one less than `rg -c "^### "` (50 vs 51 today): every source section has a status, and the one exception is §5.19, the gaps list.

### Step 2 — Accounts, lead time and Convex Discord rules [dev]

These accounts gate the launch, and two of them need time:

- **HN:** "Please don't use HN primarily for promotion"; "Don't have your username be that of your company or project" (`sources.md` §1.2, §1.4).
- **Product Hunt:** "Company and brand accounts can't submit launches or comment", and a complete profile has "A first + last name, A clear profile photo of yourself, A headline and/or about section, A unique (non-company or generic) username" (§2.1, §2.6).
- **Convex Discord:** its show-and-tell rules can only be read after joining (§5.10).

Start these now. The HN history has to be real participation, so it can't be rushed in the week before launch.

- [ ] HN account in your own name. Comment and submit on topics you'd read anyway, from now until launch
- [ ] Product Hunt: personal profile complete (name, photo, headline, non-company username), email verified (§2.1: "To submit a launch, your account also needs a verified email address")
- [ ] dev.to account; Hashnode account (with a blog, needed for the canonical-URL control, §5.14)
- [ ] DevHunt: sign in with GitHub. The tool is submitted and the $49 launch bought in step 10
- [ ] Join the Convex Discord (https://discord.com/invite/convex). Read the show-and-tell channel's description and pinned messages, and paste them into the Convex Discord brief in `launch-kit.md` with the date read
- [ ] Fill the Accounts table in `launch-kit.md` (step 3 creates it; if step 3 hasn't run yet, note the details and fill them in afterwards)

#### .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md

No new content. This step fills the Accounts table rows and the Convex Discord brief's "Pinned rules" field that step 3 lays out.

Verify: every Accounts row has a handle, created date, profile-complete and email-verified value. The Convex Discord brief's "Pinned rules" field is not empty and carries the date read.

### Step 3 — Launch kit: channel briefs and fact sheet [agent]

The developer writes every public sentence by hand (Show HN bans generated or AI-edited post
and comment text — `sources.md` §1.4, §1.7). This step builds the one place that holds the
rules, limits, link targets and facts so writing is transcription from a brief, not research
done live. It creates `launch-kit.md` with every section the later steps fill: a dates table
(step 10), an accounts table (step 2), canonical links (filled now from `public-copy.md` and
the launch-week route plan), eleven channel briefs (filled now), a fact sheet (filled now),
and placeholder sections for the prepared answers (step 4), the submission list / schedule /
launch-morning checklist / post-launch routine (step 5), the hand-written posts (step 6), and
the lint and feedback logs (step 7, step 5's routine). Every post slot is an empty
`<!-- slot:id --><!-- /slot -->` pair — no prose ships from an agent step.

- [ ] `launch-kit.md` skeleton: dates, accounts, canonical links, briefs, fact sheet, prepared answers, posts, submission list, schedule, launch-morning checklist, post-launch routine, lint log, feedback log
- [ ] Channel briefs: Show HN, Product Hunt, LinkedIn, Convex Discord, dev.to, Hashnode, DevHunt, Cooperpress, This Week in React, jamstack.org, awesome-nextjs
- [ ] Fact sheet: what VexCMS is, packages and versions, requirements, feature facts per launch-week day with docs links, the try-it paths (demo, quickstart)

#### .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md

````markdown
# Launch kit — VexCMS 0.1.0

> Every public sentence in this kit — every post, title, comment, listing field and PR line —
> is written by the developer. Agent-run steps in this file only supply facts, links, rules
> and checks; nothing here is generated or AI-edited text, because Hacker News bans exactly
> that in both posts and comments ("Please don't put generated text in HN posts... Don't post
> generated text or AI-edited text", `sources.md` §1.7). A post slot below is empty until the
> developer fills it.
>
> Wording source: every verbatim string in this kit is copied from
> `.agent/docs/specs/2026-11-06-public-presence/public-copy.md`, never retyped. Nothing on any
> surface names a paid tier, a paid feature, a price, or a customer.
>
> Slot format: every post placeholder is wrapped `<!-- slot:<id> --> … <!-- /slot -->` on its
> own lines. A `post:<slug>` slot holds `title: …`, `excerpt: …`, a blank line, then the
> markdown body. A `page:launch-week` slot holds `title:`, `hero.badge:`, `hero.heading:`,
> `hero.subheading:`, `cta.heading:`, `cta.subheading:`, then five `action:<label>|<href>` lines. Every other slot
> holds plain text or front matter + body as noted in its channel brief.

## Dates

Filled in step 10, once L's start date is known.

| Day | Date | PT time |
|---|---|---|
| T-1 (Release, Sun) | TBD | — |
| D1 (Mon) | TBD | 05:30 checklist; 07:00 Show HN |
| D2 (Tue) | TBD | 00:01 Product Hunt live |
| D3 (Wed) | TBD | — |
| D4 (Thu) | TBD | — |
| D5 (Fri) | TBD | — |

## Accounts

Filled in step 2. Columns match that step's Verify line.

| Channel | Handle | Created | Profile complete | Email verified |
|---|---|---|---|---|
| Hacker News | TBD | TBD | n/a | n/a |
| Product Hunt | TBD | TBD | TBD | TBD |
| dev.to | TBD | TBD | n/a | n/a |
| Hashnode | TBD | TBD | n/a | n/a |
| DevHunt (GitHub sign-in) | TBD | TBD | n/a | n/a |
| Convex Discord | TBD | TBD | n/a | n/a |

## Canonical links

From `public-copy.md`'s Canonical URLs section plus the launch-week routes this spec adds.

| Target | URL |
|---|---|
| Announcement | https://vexcms.dev/posts/vexcms-0-1-0 |
| Brand kit | https://vexcms.dev/brand |
| Roadmap (docs) | https://docs.vexcms.dev/roadmap/ |
| Comparison (docs) | https://docs.vexcms.dev/compare/ |
| Live demo | https://vexcms.dev/admin |
| Quickstart (docs) | https://docs.vexcms.dev/guides/quickstart/ |
| Repository | https://github.com/ianyimi/vex |
| Feature post — real-time admin + live preview | https://vexcms.dev/posts/real-time-admin-and-live-preview |
| Feature post — one config → schema + types | https://vexcms.dev/posts/one-config-schema-and-types |
| Feature post — RBAC + hooks and validation | https://vexcms.dev/posts/access-control-hooks-validation |
| Feature post — create-vexcms → deployed site | https://vexcms.dev/posts/create-vexcms-to-deployed |
| Recap page | https://vexcms.dev/launch-week |
| Clip — real-time admin + live preview | https://vexcms.dev/launch/real-time-admin-and-live-preview.mp4 |
| Clip — one config → schema + types | https://vexcms.dev/launch/one-config-schema-and-types.mp4 |
| Clip — RBAC + hooks and validation | https://vexcms.dev/launch/access-control-hooks-validation.mp4 |
| Clip — create-vexcms → deployed site | https://vexcms.dev/launch/create-vexcms-to-deployed.mp4 |

### Not-yet-live URLs

The link check (step 13) reads this table instead of failing on a draft route.

| URL | Live from |
|---|---|
| https://vexcms.dev/posts/vexcms-0-1-0 | D1 (published from the admin the same day) |
| https://vexcms.dev/posts/real-time-admin-and-live-preview | D2 |
| https://vexcms.dev/posts/one-config-schema-and-types | D3 |
| https://vexcms.dev/posts/access-control-hooks-validation | D4 |
| https://vexcms.dev/posts/create-vexcms-to-deployed | D5 |
| https://vexcms.dev/launch-week | D5 |
| https://vexcms.dev/launch/real-time-admin-and-live-preview.mp4 | D2 (linked from that day's post) |
| https://vexcms.dev/launch/one-config-schema-and-types.mp4 | D3 |
| https://vexcms.dev/launch/access-control-hooks-validation.mp4 | D4 |
| https://vexcms.dev/launch/create-vexcms-to-deployed.mp4 | D5 |

## Channel briefs

### Show HN

Purpose/day: D1, ~07:00 PT, linking https://vexcms.dev.

Hard rules:

- "To post, submit a story whose title begins with \"Show HN\"." — `sources.md` §1.1.
- "Write your text by hand. Don't use an LLM to generate any of it (not even a tiny bit,
  including to edit or spruce it up)." — `sources.md` §1.4, reaffirmed §1.7.
- "If the title includes the name of the site, please take it out, because the site name will
  be displayed after the link." — `sources.md` §1.2. No "vexcms.dev" in the title text.
- "Please don't do things to make titles stand out, like using uppercase or exclamation
  points, or saying how great an article is." — `sources.md` §1.2.
- "If the title contains a gratuitous number or number + adjective, we'd appreciate it if
  you'd crop it." / "Otherwise please use the original title... don't editorialize." —
  `sources.md` §1.2.
- "Please submit the original source." — `sources.md` §1.2. Link https://vexcms.dev (Design Decision 5), not a
  third-party writeup.
- "Your text should show up at the top of the Show HN submission, but if for some reason it
  doesn't, add it as a first comment to the thread." — `sources.md` §1.4.
- "Include a clear statement of what your project is or does." / "Include text giving the
  backstory of how you came to work on this, and explaining what's different about it." —
  `sources.md` §1.4.
- "Don't solicit upvotes, comments, or submissions." — `sources.md` §1.2, reaffirmed §1.3
  ("Can I ask people to upvote my submission? No.") and §1.4 ("Make sure your friends and
  users do not add booster comments in the thread").
- "Don't have your username be that of your company or project." — `sources.md` §1.4.
  `@ianyimi` posts, not a `vexcms` account.
- "The project must be something you've worked on personally and which you're around to
  discuss." — `sources.md` §1.1. The maintainer stays in the thread.

Limits: none quoted in `sources.md` for title or text length.

What the post must contain: a plain one-sentence statement of what VexCMS is (fact sheet "What
VexCMS is"), the backstory and what's different, and the try-it path (demo or
`pnpm create vexcms` (the post-Release command; `copy-flip.patch` drops `@alpha`), since "Please make it easy for users to try your thing out,
ideally without barriers such as signups or emails" — `sources.md` §1.1 — note where Convex
signup is a real friction point per `sources.md` §1.4).

<!-- slot:hn:title -->
<!-- /slot -->

<!-- slot:hn:text -->
<!-- /slot -->

### Product Hunt

Purpose/day: D2, scheduled, live 00:01 PT — "Every launch goes live at 12:01 AM Pacific Time
on the day you schedule." `sources.md` §2.1, §2.2.

Hard rules:

- "Company and brand accounts can't submit launches or comment. Sign up with your own name" —
  `sources.md` §2.1. "Profiles appear human and represent an individual, not a company" —
  `sources.md` §2.6.
- "your account also needs a verified email address" — `sources.md` §2.1.
- "You can schedule a launch from tomorrow up to 30 days ahead." — `sources.md` §2.2.
- "Never pay for upvotes or use services that promise them." — `sources.md` §2.1, reaffirmed
  §2.4, §2.6, §2.7.
- "Don't use fake or extra accounts. Every account should belong to one real person." —
  `sources.md` §2.4.
- "We only feature products that are currently available." / "We only feature products that
  are ready for use" — `sources.md` §2.8. The scaffolder and demo must work end-to-end before
  scheduling.
- "We do not feature: ... Templates, Boilerplates" — `sources.md` §2.8. Frame VexCMS as a
  working CMS app, not a code template, given `create-vexcms` is a scaffolder.

Limits (`sources.md` §2.3):

- Name: up to 40 characters, no tagline or emoji.
- Tagline: up to 60 characters, no hype ("the best", "#1").
- Description: up to 500 characters, value first.
- Logo: 240×240px, JPG/PNG/GIF, ≤2MB.
- Gallery images: at least one, 1270×760px recommended.
- Pricing: Free.
- Launch tags: up to 3.
- Maker comment: up to 5,000 characters, posted and pinned at launch.
- Open-source field: link https://github.com/ianyimi/vex.

What the post must contain: the fields above, built from the fact sheet's "What VexCMS is" and
packages facts, plus the repo link in the open-source field.

<!-- slot:ph:name -->
<!-- /slot -->

<!-- slot:ph:tagline -->
<!-- /slot -->

<!-- slot:ph:description -->
<!-- /slot -->

<!-- slot:ph:maker-comment -->
<!-- /slot -->

<!-- slot:ph:tags -->
<!-- /slot -->

### LinkedIn

Purpose/day: D1–D5, one post every day (the announcement, then each feature post, then the
recap), each with that day's clip (silent H.264 MP4, ≤60s, ≤10MB, `apps/www/public/launch/`)
uploaded natively — "Silent → no caption track; post text describes the clip."

Hard rules: no official LinkedIn length or link-card limit was found —
"`sources.md` §5.17: no official length or link-card limit found... None was found, so this
channel has no quotable rule for the launch spec." Keep the clip native, the link in the post
body, and since the clip carries no audio or captions, the post text must describe what it
shows.

Limits: none quoted (`sources.md` §5.17, [UNVERIFIED]).

What each post must contain: a link to that day's canonical URL (announcement, feature post,
or recap) and a description of the attached clip.

<!-- slot:linkedin:d1 -->
<!-- /slot -->

<!-- slot:linkedin:d2 -->
<!-- /slot -->

<!-- slot:linkedin:d3 -->
<!-- /slot -->

<!-- slot:linkedin:d4 -->
<!-- /slot -->

<!-- slot:linkedin:d5 -->
<!-- /slot -->

### Convex Discord

Purpose/day: D1, #show-and-tell post linking the announcement.

Hard rules: the channel's rules are behind login — "Could not fetch channel list or any
published #show-and-tell posting rules — Discord's live channel content is not reachable via
unauthenticated fetch... the launch spec must note this as 'manual, no published rules — join
and observe channel topic/pinned posts at posting time'." `sources.md` §5.10. Step 2 pastes
the pinned rules here after joining:

```
[pinned #show-and-tell rules — pasted here in step 2, after joining the Convex Discord]
```

Limits: none published (`sources.md` §5.10, [UNVERIFIED] until step 2's paste).

What the post must contain: the fact sheet's "What VexCMS is" and a link to the announcement,
adjusted once the pinned rules above are read.

<!-- slot:discord:d1 -->
<!-- /slot -->

### dev.to

Purpose/day: D1, cross-post of the www announcement.

Hard rules (`sources.md` §5.13):

- "canonical_url: link for the canonical version of the content" — set to
  `https://vexcms.dev/posts/vexcms-0-1-0`.
- "Add up to four comma-separated tags per post" — "tags: max of four tags, needs to be
  comma-separated".
- "ai_disclosure_level: AI usage disclosure (`not_disclosed`, `no_ai`, `some_ai`,
  `fully_autonomous`)" — front matter is required; the post text itself is hand-written
  (Design Decision 2), so disclose accordingly.

Limits: ≤4 tags (`sources.md` §5.13); front matter needs `title`, `published`, `tags`,
`canonical_url`, `ai_disclosure_level`.

What the post must contain: front matter with the fields above and a body that mirrors the www
announcement, canonical-linked to it.

<!-- slot:devto:announcement -->
<!-- /slot -->

### Hashnode

Purpose/day: D1, cross-post of the www announcement.

Hard rules (`sources.md` §5.14):

- "Click on the Add Original Article button to change the canonical URL of the article to the
  original article" — set the canonical URL to `https://vexcms.dev/posts/vexcms-0-1-0`.
- Optional: "Yes, hide from Hashnode and display on my blog only" if the cross-post should not
  appear in Hashnode's own feed.

Limits: none found (`sources.md` §5.14).

What the post must contain: the same body as the dev.to cross-post, canonical-linked via "Add
Original Article".

<!-- slot:hashnode:announcement -->
<!-- /slot -->

### DevHunt

Purpose/day: launch week, paid $49 slot bought in step 10; the listing text is drafted here.

Hard rules (`sources.md` §2.9, §2.10):

- "Sign in, open your account and submit your tool with its name, website, description, logo
  and screenshots." — `sources.md` §2.9.
- "Listing a tool is free: every tool gets a permanent page with a nofollow link." /
  "Launch ($49, one time): pick the launch week, a spot in the weekly newsletter, a permanent
  dofollow link, listed above other launches on equal votes, plus its own post on X." —
  `sources.md` §2.9, §2.10.
- Category list includes "Open Source," "DB," "Code" — `sources.md` §2.10.

Limits: no field-length limits were found (`sources.md` §2.9, §2.10, [UNVERIFIED]).

What the post must contain: name, website (`https://vexcms.dev`), description, logo, and
screenshots — the same assets as the Product Hunt gallery.

<!-- slot:devhunt:listing -->
<!-- /slot -->

### Cooperpress

Purpose/day: pitch email, sent after the D1 announcement is live.

Hard rules (`sources.md` §5.1): "No public 'submit a link' web form exists; the only official
contact channel is email." / "Editorial: editor@cooperpress.com" — one address covers
JavaScript Weekly, Node Weekly and React Status.

Limits: none — "a short, direct pitch email is the expected format, not a structured form"
(`sources.md` §5.1).

What the email must contain: a short pitch, angled per publication if the developer chooses —
general tool news for JS Weekly, a React/Next.js integration angle for React Status, a
backend/Convex-functions angle for Node Weekly (implication drawn in `sources.md` §5.1, not a
quoted rule) — plus the announcement link.

<!-- slot:cooperpress:email -->
<!-- /slot -->

### This Week in React

Purpose/day: optional, during the launch week — a note to the newsletter's author, not a
submission.

Hard rules: no documented submission route exists — "Site navigation exposes only: Articles,
Newsletter, Thread, Sponsor — no 'Submit' nav item... no quoted 'how to submit a link' rule
anywhere on the site" (`sources.md` §5.2, [UNVERIFIED]). The only route found is a direct
mention to the author, Sébastien Lorber, via the contact links on his newsletter issue pages
(GitHub, X, Bluesky, LinkedIn — `sources.md` §5.2).

Limits: none.

What the note must contain: a short, direct message — this is cold outreach, not a submission
queue (`sources.md` §5.2).

<!-- slot:twir:note -->
<!-- /slot -->

### jamstack.org

Purpose/day: D3, PR against `jamstack/jamstack.org` adding a new entry under
`src/site/headless-cms/`.

Hard rules (`sources.md` §5.4):

- "We accept contributions submitted as pull requests." Each CMS is its own markdown file
  (`caisy.md`, `strapi.md`, `sanity.md`, …) — VexCMS adds `vexcms.md`.
- Required front matter fields, from the `caisy.md` sample quoted verbatim: `title`,
  `homepage`, `twitter`, `opensource` (`"Yes"`/`"No"` as a string), `typeofcms`,
  `supportedgenerators` (a list), `description`, optional `images`.
- No numeric minimum (stars, age) was found in the repo's contribution docs.

Limits: the image spec quoted in the root README ("jpeg 600px wide and 400px tall") is for
resource thumbnails, not confirmed for CMS entries specifically
(`sources.md` §5.4, [UNVERIFIED exact pixel spec for this entry type]). Step 10 reads a
recently merged CMS-entry PR before drafting this one, per `sources.md` §5.19.

What the entry must contain: `opensource: "Yes"` (Apache-2.0), a `typeofcms` value, and
`supportedgenerators` including Next.js, plus the description below.

<!-- slot:jamstack:description -->
<!-- /slot -->

### awesome-nextjs

Purpose/day: D3, one PR against `unicodeveloper/awesome-nextjs`.

Hard rules (`sources.md` §5.7):

- "Make an individual pull request for each suggestion." — one PR, not bundled with anything
  else.
- "Use the following format: `[Title Case Name](link) - Description.`"
- "Start the description with a capital and end with a full stop/period." / "Keep descriptions
  short and simple, but descriptive."

Limits: none numeric found (`sources.md` §5.7).

What the line must contain: `[VexCMS](<link>) - <one capitalized, period-terminated sentence>`
— the link target (repo vs. vexcms.dev) is the developer's call; no rule in `sources.md` §5.7
specifies which.

<!-- slot:awesome-nextjs:line -->
<!-- /slot -->

## Fact sheet

### What VexCMS is

- GitHub repository description: "Type-safe headless CMS built on Convex, with a real-time
  admin panel, end-to-end type inference, auth, ABAC — no separate backend to run." (read via
  `gh api repos/ianyimi/vex --jq .description`; the "ABAC" wording there does not match the
  role-based `defineAccess` model below; the ABAC / RBAC consistency-matrix row in step 21
  resolves which surface changes.)
- Docs homepage description: "A type-safe headless CMS built natively on Convex — real-time
  reactivity, generated types, and zero database configuration." —
  `apps/docs/src/content/docs/index.mdx:3`.
- Homepage: https://vexcms.dev. Docs: https://docs.vexcms.dev.

### Packages

Eight published packages, all at `0.1.0-alpha.29` with `publishConfig.tag: "alpha"` today
(re-check in step 13 — Release's `changeset pre exit` moves every one to `0.1.0` before the
kit goes live):

| Package | Description | Source |
|---|---|---|
| `@vexcms/core` | Field factories, schema generation, typed collection APIs | `packages/core/package.json` |
| `@vexcms/react` | Admin components and hooks | `packages/react/package.json` |
| `@vexcms/next` | Next.js adapter and admin routes | `packages/next/package.json` |
| `@vexcms/cli` | `vex` CLI: dev server orchestration and type generation | `packages/cli/package.json` |
| `@vexcms/better-auth` | Better Auth adapter | `packages/better-auth/package.json` |
| `@vexcms/file-storage-convex` | Convex file-storage adapter | `packages/file-storage-convex/package.json` |
| `@vexcms/richtext-plate` | Plate rich-text editor integration | `packages/richtext-plate/package.json` |
| `create-vexcms` | Scaffolding CLI | `packages/create-vexcms/package.json` |

`@vexcms/telemetry` is `"private": true` (`packages/telemetry/package.json`) — not published,
not one of the eight.

### Requirements

Re-check in step 13 — these peer ranges live in a shared catalog a sibling dependency change
could move before Release.

| Requirement | Floor | Source |
|---|---|---|
| Node | `>=20.0.0` | `package.json#engines` (repo root) |
| Next.js | `>=15.0.0` | `pnpm-workspace.yaml` `catalogs.peers.next`; declared by `packages/react/package.json#peerDependencies.next` and `packages/next/package.json#peerDependencies.next` |
| React / react-dom | `>=18.0.0` | `pnpm-workspace.yaml` `catalogs.peers.react`/`react-dom`; declared by `packages/react/package.json#peerDependencies` and `packages/next/package.json#peerDependencies` |
| Convex | `>=1.44.0 <2` | `pnpm-workspace.yaml` `catalogs.peers.convex`; declared by `packages/core/package.json#peerDependencies.convex`, `packages/react/package.json#peerDependencies.convex`, `packages/next/package.json#peerDependencies.convex` |
| Zod (for `@vexcms/next` consumers) | `>=4.0.0 <5` | `pnpm-workspace.yaml` `catalogs.peers.zod`; declared by `packages/next/package.json#peerDependencies.zod` |

### Try it

| Path | Detail | Source |
|---|---|---|
| Live demo | https://vexcms.dev/admin, anonymous, read-only | `apps/www` production |
| Quickstart | `pnpm create vexcms` (after Release; `@alpha` until then) to a signed-in admin panel in under five minutes | `apps/docs/src/content/docs/guides/quickstart.mdx` (re-check in step 13 — launch-infrastructure may update this page's content) |
| Scaffold flags | `--bare`, `--orgs`, `--monorepo`, `--yes` | `packages/create-vexcms/README.md` (re-check in step 13) |
| Repository | https://github.com/ianyimi/vex | — |

### Day facts

#### D1 — Announcement

VexCMS 0.1.0's shipped feature list (16 field types, versioning and drafts, Convex schema +
type codegen, the real-time admin panel, RBAC with indexed rules, live preview, lifecycle
hooks and server-side validation, the CLI and `create-vexcms`) — `apps/docs/src/content/docs/roadmap.md:10-44`
("Shipped" section; re-check in step 13 — public-presence rewrites this page's shape to
Shipped/After-0.1.0/Not-planned before launch). Funding line and `planned`-issue links belong
in this post — `public-copy.md` "Funding" and its `planned` issues table.

Docs: https://docs.vexcms.dev/roadmap/

#### D2 — Real-time admin + live preview

- "✅ Real-time admin panel" — `apps/docs/src/content/docs/roadmap.md:15`.
- Live preview streams unsaved form state onto the real route, origin-allowlisted and gated by
  a session-verified cookie — `apps/docs/src/content/docs/roadmap.md:33`; mechanism documented
  in `apps/docs/src/content/docs/guides/live-preview.mdx` ("How it works", "Security: the gate
  is yours to set"); implemented in `packages/core/src/livePreview/resolveSettings.ts` (preview
  settings precedence) and `packages/core/src/livePreview/panelCookie.ts` (the session-verified
  cookie).

Docs: https://docs.vexcms.dev/guides/live-preview/

#### D3 — One config → Convex schema + end-to-end types

- "✅ Convex schema + type codegen" — `apps/docs/src/content/docs/roadmap.md:14`.
- `generateVexSchema` (`packages/core/src/schema/generateVexSchema.ts`) and `generateVexTypes`
  (`packages/core/src/types/generateVexTypes.ts`) turn one `vex.config.ts` into the Convex
  schema and the project's generated types; `vex dev` / `vex generate` run them —
  `packages/cli/src/lib/generateSchema.ts`, `packages/cli/src/commands/generate.ts`.

Docs: https://docs.vexcms.dev/guides/quickstart/ (config → running app); try the generated
types path with `pnpm create vexcms`.

#### D4 — RBAC + server-enforced hooks and validation

- RBAC compiles permission rules to indexed Convex queries: `packages/core/src/access/compileQueryConstraints.ts`
  ("Compiles a recorded constraint list to a `withIndex` range function"),
  `packages/core/src/access/pickConvexQueryIndex.ts`,
  `packages/core/src/access/createQueryIndexConstraintBuilder.ts`. Documented in
  `apps/docs/src/content/docs/guides/access-control.mdx` ("How it works", "Permission check
  shapes").
- Every write runs through `hasPermission` and the field validators regardless of client
  behavior — `packages/core/src/db/prepareEdit.ts` (calls `hasPermission` then
  `validateFields`). Lifecycle hooks (`beforeChange`/`beforeDelete`/`afterChange`/`afterDelete`)
  and the async, database-aware `validate()` are documented in
  `apps/docs/src/content/docs/guides/lifecycle-hooks.mdx` ("The four hooks", "Server-side field
  validation").

Docs: https://docs.vexcms.dev/guides/access-control/ and
https://docs.vexcms.dev/guides/lifecycle-hooks/

#### D5 — create-vexcms → deployed site

- "✅ `create-vexcms` scaffolder" — `apps/docs/src/content/docs/roadmap.md:27`.
- Two templates: `base-nextjs` (auth, admin panel, media, no starter collections) and
  `marketing-site` (adds pages/headers/footers/themes, 8 content blocks, a seeded home page) —
  `packages/create-vexcms/README.md` (re-check in step 13).

Docs: https://docs.vexcms.dev/guides/quickstart/

## Prepared answers

Filled in step 4 — one fact sheet per question (`### Q1` … `### Q9`), each with Facts,
Verbatim, Links and a Don't-say list. These are facts the developer answers from, never
paste-ready text (decision 2; HN bans AI-edited comments, `sources.md` §1.7).

## Posts

Every slot below is empty — filled by the developer in step 6. Nothing here is prose.

### D1 — www announcement

Owned by `2026-11-06-public-presence` step 14 (`posts` draft seeded in `apps/www/convex/seed.ts`);
not transcribed from this kit. Linked from every D1 channel below.

### D1 — Show HN

See the Show HN brief above for the slots `hn:title` and `hn:text`.

### D1 — LinkedIn, Discord, dev.to, Hashnode

See the LinkedIn (`linkedin:d1`), Convex Discord (`discord:d1`), dev.to
(`devto:announcement`) and Hashnode (`hashnode:announcement`) briefs above.

### D2 — Feature post: real-time admin + live preview

<!-- slot:post:real-time-admin-and-live-preview -->
<!-- /slot -->

### D2 — LinkedIn

See `linkedin:d2` above.

### D2 — Product Hunt listing

See the Product Hunt brief above for `ph:name`, `ph:tagline`, `ph:description`,
`ph:maker-comment`, `ph:tags`.

### D3 — Feature post: one config → schema + types

<!-- slot:post:one-config-schema-and-types -->
<!-- /slot -->

### D3 — LinkedIn

See `linkedin:d3` above.

### D3 — jamstack.org, awesome-nextjs

See the jamstack.org (`jamstack:description`) and awesome-nextjs (`awesome-nextjs:line`)
briefs above.

### D4 — Feature post: RBAC + server-enforced hooks and validation

<!-- slot:post:access-control-hooks-validation -->
<!-- /slot -->

### D4 — LinkedIn

See `linkedin:d4` above.

### D5 — Feature post: create-vexcms → deployed site

<!-- slot:post:create-vexcms-to-deployed -->
<!-- /slot -->

### D5 — Recap page: launch-week

<!-- slot:page:launch-week -->
<!-- /slot -->

### D5 — LinkedIn

See `linkedin:d5` above.

### Passive channels

DevHunt (`devhunt:listing`), Cooperpress (`cooperpress:email`), This Week in React
(`twir:note`) — see their briefs above for timing.

## Submission list

Filled in step 5 — route, rules reference, timing and status per passive-channel submission.

## Schedule

Filled in step 5 — T-1 through D5, Pacific time, with channel, artifact, link target and
blocked reply block per row.

## Launch-morning checklist

Filled in step 5 — T-1 (after Release) and D1 05:30 PT, one command or URL per check.

## Post-launch routine

Filled in step 5 — the 14-day daily sweep and where each kind of feedback lands.

## Lint log

Filled and re-run in step 7. Columns: `Check` (the rule being tested) | `Post / slot` (which
kit slot it ran against) | `Result` (`pass` / `finding`) | `Note` (what the finding was, empty
on pass).

| Check | Post / slot | Result | Note |
|---|---|---|---|

## Feedback log

Filled during the post-launch routine (step 5's routine section, used daily after launch).
Columns: `Date` | `Source` (GitHub issue / Discussions / HN thread / PH comment / dev.to or
Hashnode comment / LinkedIn / Convex Discord / DevHunt / `hello@` or `security@`) | `Summary` |
`Landed as` (issue number, Discussions reply link, or a `backlog.md` entry) | `Status`.

| Date | Source | Summary | Landed as | Status |
|---|---|---|---|---|
````

Verify: `test -f .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md`. `rg -c '^### ' .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md` prints `11` or more (one per channel brief, excluding the `## Channel briefs` parent heading which is `##`). `rg -c 'sources\.md §' .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md` prints `20` or more. `rg -ni "pro tier|agency|enterprise|maprios|\bSSO\b|audit log|co-edit|annual licen|\$[0-9]" .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md` prints nothing — negative test: `cp .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md /tmp/kit-banned.md && echo 'this covers the enterprise tier' >> /tmp/kit-banned.md && rg -ni "enterprise" /tmp/kit-banned.md` prints the inserted line, proving the rule catches an addition; `rm /tmp/kit-banned.md`. Post slots hold no prose: `rg -Pzo '(?s)<!-- slot:[a-z0-9:_.-]+ -->\n.*?<!-- /slot -->' .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md | rg -vz '^<!-- slot:[a-z0-9:_.-]+ -->\n<!-- /slot -->$'` prints nothing — negative test: `cp .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md /tmp/kit-slot.md && sed -i '' 's#<!-- slot:hn:title -->#<!-- slot:hn:title -->\nShow HN: VexCMS#' /tmp/kit-slot.md && rg -Pzo '(?s)<!-- slot:hn:title -->\n.*?<!-- /slot -->' /tmp/kit-slot.md | rg -vz '^<!-- slot:hn:title -->\n<!-- /slot -->$'` prints the inserted line, proving the check catches prose in a slot; `rm /tmp/kit-slot.md`.

### Step 4 — Prepared-answer fact sheets [agent]

HN bans AI-edited comments, so a "prepared answer" is a fact sheet the developer answers from
in their own words, not paste-ready text (decision 2, `sources.md` §1.7). This step replaces
step 3's one-line Prepared-answers placeholder with nine fact sheets — `### Q1` through
`### Q9` — each carrying Facts (with sources), the verbatim `public-copy.md` lines it leans
on, links, and a "Don't say" list. The headings live inside the `launch-kit.md` fenced block
created in step 3, so they never conflict with spec.md's own heading rules.

- [ ] Why not Payload / Sanity / Strapi; Convex lock-in; will it go paid; licence; solo-maintainer bus factor; migration from other CMSs
- [ ] Telemetry (opt-out CLI telemetry); is it production-ready; can Convex be self-hosted

#### .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md

One edit: the `## Prepared answers` section (step 3's one-line placeholder paragraph) is
replaced with the nine fact sheets below. Anchor: the line beginning `Filled in step 4 — one
fact sheet per question`.

```markdown
## Prepared answers

Facts and sources, not paste-ready text — HN bans AI-edited comments (`sources.md` §1.7).

### Q1 — Why not Payload, Sanity, or Strapi?

#### Facts

- VexCMS runs inside the Convex deployment already in use — no separate database to provision,
  no second backend process. Payload needs a self-managed Node/Next server plus a
  self-provisioned database (MongoDB, Postgres, or SQLite); Sanity's Content Lake is
  vendor-managed with no self-host option; Strapi needs a self-managed Node server plus a SQL
  database, or its paid Strapi Cloud — `.agent/docs/specs/2026-11-06-public-presence/competitors.md`,
  "Production deployment requirement" table.
- Real-time admin updates and live preview ship in VexCMS's free core
  (`apps/docs/src/content/docs/roadmap.md:15,33`). Compare each competitor's free-tier
  equivalent in `competitors.md` (rows 7–8) before answering; the comparison page covers free
  tiers only (public-presence Design Decision 20).
- Types and schema generate from one `vex.config.ts` via `generateVexSchema` /
  `generateVexTypes` (`packages/core/src/schema/generateVexSchema.ts`,
  `packages/core/src/types/generateVexTypes.ts`) — comparable in spirit to Payload's
  `payload generate:types` and Sanity's TypeGen, but there is no separate database schema to
  keep in sync: Convex's schema and VexCMS's types come from the same config run.
- The full row-by-row comparison, with a check date per competitor, is drafted for
  `apps/docs/src/content/docs/compare.mdx` (public-presence step 12) and lives in
  `.agent/docs/specs/2026-11-06-public-presence/competitors.md` today.

#### Verbatim

None — this question has no `public-copy.md` line; answer from the facts above, in your own
words.

#### Links

- https://docs.vexcms.dev/compare/ (once published — re-check in step 13)
- https://docs.vexcms.dev/roadmap/

#### Don't say

A price, a tier name, or that another product is bad — only what VexCMS does differently and
where it's not finished (its roadmap).

### Q2 — Does Convex lock you in?

#### Facts

- Convex is open source and self-hostable: "Self-hosted Convex runs the open-source backend,
  and contains the same fully up-to-date code the cloud service uses" — fetched from
  https://docs.convex.dev/self-hosting.md on 2026-11-06.
- Licence: "Convex uses an FSL Apache 2.0 License which is a fair source license. You can do
  almost anything Apache-2.0 allows, except create another product designed to compete with
  the hosted Convex Cloud... All code is automatically converted to full Apache-2.0 two years
  after its creation." — same source.
- The self-hosting guide itself lives at
  https://github.com/convex/convex-backend/blob/main/self-hosted/README.md (linked from the
  page above, not separately fetched in this pass).
- VexCMS's own code is unrelated to this question's licence: VexCMS is Apache-2.0
  (`LICENSE`), full stop; Convex's FSL terms govern Convex's own backend, not anything VexCMS
  ships.

#### Verbatim

None — this is a Convex-platform fact, not a `public-copy.md` line.

#### Links

- https://docs.convex.dev/self-hosting

#### Don't say

Don't claim VexCMS itself can run without Convex — it can't; don't overstate self-hosting as
effortless — the guide is Convex's own, not something VexCMS automates.

### Q3 — Will VexCMS go paid?

#### Facts

- `public-copy.md` "Paid-work line" is the verbatim public answer everywhere this question
  comes up.

#### Verbatim

"Paid add-ons may come later, as separate packages, after the free roadmap. The core stays
Apache-2.0, and nothing free becomes paid." — `public-copy.md` § Paid-work line.

#### Links

- https://docs.vexcms.dev/roadmap/

#### Don't say

No tier name, no price, no feature list for anything paid, no date.

### Q4 — What's the licence?

#### Facts

- `public-copy.md` "Licence line" is the verbatim answer.
- Full text lives in `LICENSE` (repo root); `NOTICE` carries the copyright line: "VexCMS /
  Copyright 2026 Isaiah Anyimi / This product includes software developed as part of the
  VexCMS project (https://github.com/ianyimi/vex)." — `NOTICE`.

#### Verbatim

"VexCMS is Apache-2.0 licensed." — `public-copy.md` § Licence line.

#### Links

- https://github.com/ianyimi/vex/blob/master/LICENSE

#### Don't say

Don't conflate VexCMS's licence with Convex's FSL Apache 2.0 terms (Q2) — they're two
different projects' licences.

### Q5 — What's the bus factor? (solo maintainer)

#### Facts

- `public-copy.md` "Who builds this" is the verbatim answer, including the triage window.

#### Verbatim

"VexCMS is built and maintained by one developer, [@ianyimi](https://github.com/ianyimi), in
their free time. New issues are triaged within a week; how fast a fix lands depends on its
severity and on sponsorship." — `public-copy.md` § Who builds this.

"Reports are acknowledged within a week. Supported versions: the latest 0.1.x release." —
`public-copy.md` § Security response window.

#### Links

- https://github.com/ianyimi/vex/discussions
- https://github.com/sponsors/ianyimi

#### Don't say

Don't promise a response time faster than a week, or imply a team.

### Q6 — Migrating from another CMS?

#### Facts

- No automated migration tooling exists today. There is no `vex migrate`/`vex import` CLI
  command (`packages/cli/src/commands/` holds only `dev.ts`, `deploy.ts`, `generate.ts`,
  `telemetry.ts` — none import content from another CMS), and no migration guide exists in
  `apps/docs/src/content/docs/guides/` (checked against the full file listing).
  `deploy.ts`/`dev.ts`'s "auto-migrate" refers only to Convex schema migration (field
  add/remove on your own project), not importing data from Payload/Sanity/Strapi.
- A "coming from Payload" guide was weighed in this spec's interview and deferred to the
  backlog (spec.md § Out of Scope).
- A related but different capability is on the public roadmap: "Brownfield adoption — Add
  VexCMS to an existing Convex app table by table, without migrating the data it already
  holds." — `public-copy.md` § Roadmap — after 0.1.0, item 3. That's about adopting VexCMS
  inside an existing Convex project, not importing content from a different CMS platform.

#### Verbatim

"Brownfield adoption — Add VexCMS to an existing Convex app table by table, without migrating
the data it already holds." — `public-copy.md` § Roadmap — after 0.1.0.

#### Links

- https://docs.vexcms.dev/roadmap/

#### Don't say

Don't imply an import tool exists, or that brownfield adoption (Convex-to-VexCMS) is the same
thing as migrating off another CMS product.

### Q7 — Telemetry: what's collected, how do I turn it off?

#### Facts

- `vex` and `create-vexcms` send one anonymous event per run (`dev`, `deploy`, `create`); the
  payload is an anonymized config shape (names replaced by generated paths like `c1.f2`),
  environment facts, a coarse ok/failed outcome, and scaffold choices — never a real name,
  value, or content —
  `apps/docs/src/content/docs/guides/telemetry.mdx` § Field reference, § Config payload.
- Precedence, highest first: `DO_NOT_TRACK` → `VEX_TELEMETRY_DISABLED` → CI detection → the
  stored setting → on by default. "None of the environment-variable overrides can [turn
  telemetry on against the stored setting]." — `apps/docs/src/content/docs/guides/telemetry.mdx` § Opting out.
- Opt out with `vex telemetry disable`, or set `DO_NOT_TRACK=1` / `VEX_TELEMETRY_DISABLED=1`;
  always off automatically in CI — same section, and `packages/create-vexcms/README.md` §
  Telemetry.
- `telemetry.hideLogs` in `defineServerConfig`'s `server` config silences only the two-line
  per-run reminder — it does not disable sending — `apps/docs/src/content/docs/guides/telemetry.mdx`
  § Silencing the reminder: "There is no config option to disable telemetry itself — only to
  silence this log line."
- Design rationale (private workspace package, size cap, allowlisted fields, no hashing of
  names): `.agent/docs/specs/2026-10-26-build-time-telemetry/spec.md` Design Decisions 1–14.

#### Verbatim

None — this is the telemetry docs page's own wording, not a `public-copy.md` line.

#### Links

- https://docs.vexcms.dev/guides/telemetry/

#### Don't say

Don't say telemetry can be disabled from `vex.config.ts` — it can't (the docs page states this
explicitly); don't understate what's collected — point to the field reference rather than
summarizing from memory.

### Q8 — Is VexCMS production-ready?

#### Facts

- VexCMS ships `0.1.0` at this launch (`packages/*/package.json#version`, re-check in
  step 13 — the version shown here is pre-Release `0.1.0-alpha.29`).
  `packages/create-vexcms/README.md`'s warning banner describes the pre-0.1.0 posture:
  "pre-release software... Use it for experiments and evaluation only; the projects it
  scaffolds should not carry production traffic or real user data." (re-check in step 13 —
  this banner is removed by the copy-flip patch at Release, so quote the *shipped* 0.1.0
  posture from the roadmap and non-goals below, not this alpha-era banner.)
- What comes after 0.1.0 is `public-copy.md` § Roadmap — after 0.1.0 (plugin system → free
  features as demand appears → brownfield adoption) plus its "Not planned" line. The
  launch plan's internal non-goal list is not quoted: several of its items are kept off every
  public surface (public-presence Design Decision 5).
- The docs roadmap carries the same shape once public-presence step 9 lands
  (`apps/docs/src/content/docs/roadmap.md`, re-check in step 13).

#### Verbatim

"Everything below is free and lands in the Apache-2.0 core. It ships in this order." —
`public-copy.md` § Roadmap — after 0.1.0 (intro line, for framing what's still coming).

#### Links

- https://docs.vexcms.dev/roadmap/

#### Don't say

Don't claim feature parity with Payload, Sanity or Strapi (Q1); don't promise a date for any
roadmap item.

### Q9 — Can Convex be self-hosted?

#### Facts

Same material as Q2 — see Q2's Facts, Links and verbatim quote. Kept as its own question
because it's asked independently of the lock-in framing.

#### Verbatim

None — Convex-platform fact, quoted in Q2.

#### Links

- https://docs.convex.dev/self-hosting
- https://github.com/convex/convex-backend/blob/main/self-hosted/README.md

#### Don't say

Don't describe self-hosting as a VexCMS feature — it's a Convex-platform capability VexCMS
inherits, not something this repo builds or supports directly.
```

Verify: `rg -c '^### Q' .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md` prints `9`. `rg -c '^#### Facts$' .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md`, `rg -c '^#### Verbatim$'`, `rg -c '^#### Links$'`, and `rg -c "^#### Don't say$"` each print `9`. Negative test: `cp .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md /tmp/kit-q.md && sed -i '' "/^### Q9/,/^### Q9/{/^#### Don't say\$/,\$d;}" /tmp/kit-q.md` removes Q9's trailing sections; `rg -c "^#### Don't say\$" /tmp/kit-q.md` then prints `8`, proving the count check catches a missing fact-sheet section; `rm /tmp/kit-q.md`.

### Step 5 — Schedule, submission list, launch-morning checklist, post-launch routine [agent]

Launch week runs from a written runbook so nothing is decided live (Supabase's own
minute-by-minute runbook is the model, `sources.md` §4.2). This step replaces step 3's four
remaining placeholders — Submission list, Schedule, Launch-morning checklist, Post-launch
routine — with the filled sections. Every submission row carries a rules citation back into
`sources.md`; the checklist is exact commands and URLs so L's step 13 pre-pass can run them
unattended; the routine names where every kind of feedback lands so none of it is lost to
memory.

- [ ] Schedule table T-1 (Sun) → D5 (Fri), PT, with reply blocks
- [ ] Submission list: Cooperpress, This Week in React, jamstack.org PR, awesome-nextjs PR, DevHunt
- [ ] Launch-morning checklist (T-1 after Release and D1 05:30 PT): production SHAs vs the reviewed SHA, npm dist-tags and pages, GitHub `master` surfaces, the demo, monitors
- [ ] Post-launch routine: daily sweep for 14 days, plus the feedback log format

#### .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md

Four edits, each replacing one of step 3's one-line placeholder paragraphs.

**1 — `## Submission list`.** Anchor: the line beginning `Filled in step 5 — route, rules
reference, timing`.

```markdown
## Submission list

| Target | Route | Rules ref | Timing | Status |
|---|---|---|---|---|
| Cooperpress | Pitch email to editor@cooperpress.com | `sources.md` §5.1 | After the D1 announcement is live | Not sent |
| This Week in React | Direct note to Sébastien Lorber (GitHub/X/Bluesky/LinkedIn) | `sources.md` §5.2 | Any day in launch week, optional | Not sent |
| jamstack.org | PR to `jamstack/jamstack.org`, new `src/site/headless-cms/vexcms.md` | `sources.md` §5.4 | D3 | Not drafted |
| awesome-nextjs | PR to `unicodeveloper/awesome-nextjs`, one README line | `sources.md` §5.7 | D3 | Not drafted |
| DevHunt | Listing submitted + $49 launch-week slot bought | `sources.md` §2.9, §2.10 | Listing + purchase in step 10; launch runs the same week as D1–D5 | Not submitted |
```

**2 — `## Schedule`.** Anchor: the line beginning `Filled in step 5 — T-1 through D5`.

```markdown
## Schedule

All times Pacific. Dates come from the Dates table above once step 10 fixes them. Every `www` publish row is one edit (cross-spec decisions 3 and 8 of `.agent/docs/product/launch-cross-spec-decisions.md`): publish the document from the production admin, then in a single commit set its `vex_status` to `"published"` in both seeds and remove that route's `draft: true` from `QUALITY_ROUTES` in `apps/www/e2e/routes.ts`.

| When (PT) | Day | Channel | Artifact | Link target | Blocked reply block |
|---|---|---|---|---|---|
| T-1, after Release | Sun | — | `changeset pre exit`, publish, `dev`→`master` merge, `npx convex run seed:reinit --prod`, then the launch-morning checklist (T-1 half) | — | — |
| 05:30 | D1 Mon | — | Launch-morning checklist (D1 half) | — | — |
| 06:45 | D1 Mon | www | Publish `/posts/vexcms-0-1-0` from the admin; same edit: seed `vex_status` → `"published"` in both seeds, `draft` flag removed from `/posts/vexcms-0-1-0` in `QUALITY_ROUTES` | https://vexcms.dev/posts/vexcms-0-1-0 | — |
| 07:00 | D1 Mon | Show HN | Title + text, linking https://vexcms.dev | https://vexcms.dev | 07:00–19:00 |
| 07:15 | D1 Mon | LinkedIn | Announcement post + demo clip | https://vexcms.dev/posts/vexcms-0-1-0 | — |
| 07:20 | D1 Mon | Convex Discord | #show-and-tell post | https://vexcms.dev/posts/vexcms-0-1-0 | — |
| 07:30 | D1 Mon | dev.to | Cross-post, `canonical_url` set | https://vexcms.dev/posts/vexcms-0-1-0 | — |
| 07:30 | D1 Mon | Hashnode | Cross-post, canonical set via "Add Original Article" | https://vexcms.dev/posts/vexcms-0-1-0 | — |
| After D1 announcement is live | D1 Mon | Cooperpress | Pitch email | editor@cooperpress.com | — |
| 00:01 | D2 Tue | Product Hunt | Listing goes live (scheduled in step 10) | PH listing page | 06:00–20:00 |
| 09:00 | D2 Tue | www | Publish `real-time-admin-and-live-preview`; same edit: seed `vex_status` → `"published"` in both seeds, `draft` flag removed from `/posts/real-time-admin-and-live-preview` in `QUALITY_ROUTES` | https://vexcms.dev/posts/real-time-admin-and-live-preview | 2h after posting |
| 09:00 | D2 Tue | LinkedIn | Feature post + clip | https://vexcms.dev/posts/real-time-admin-and-live-preview | — |
| 09:00 | D3 Wed | www | Publish `one-config-schema-and-types`; same edit: seed `vex_status` → `"published"` in both seeds, `draft` flag removed from `/posts/one-config-schema-and-types` in `QUALITY_ROUTES` | https://vexcms.dev/posts/one-config-schema-and-types | 2h after posting |
| 09:00 | D3 Wed | LinkedIn | Feature post + clip | https://vexcms.dev/posts/one-config-schema-and-types | — |
| Any time | D3 Wed | jamstack.org | Open PR | github.com/jamstack/jamstack.org | — |
| Any time | D3 Wed | awesome-nextjs | Open PR | github.com/unicodeveloper/awesome-nextjs | — |
| 09:00 | D4 Thu | www | Publish `access-control-hooks-validation`; same edit: seed `vex_status` → `"published"` in both seeds, `draft` flag removed from `/posts/access-control-hooks-validation` in `QUALITY_ROUTES` | https://vexcms.dev/posts/access-control-hooks-validation | 2h after posting |
| 09:00 | D4 Thu | LinkedIn | Feature post + clip | https://vexcms.dev/posts/access-control-hooks-validation | — |
| 09:00 | D5 Fri | www | Publish `create-vexcms-to-deployed` and the `launch-week` page; same edit: both seed `vex_status`es → `"published"` in both seeds, `draft` flags removed from `/posts/create-vexcms-to-deployed` and `/launch-week` in `QUALITY_ROUTES` | https://vexcms.dev/posts/create-vexcms-to-deployed, https://vexcms.dev/launch-week | 2h after posting |
| 09:00 | D5 Fri | LinkedIn | Feature post + clip | https://vexcms.dev/posts/create-vexcms-to-deployed | — |

DevHunt's paid launch runs for the whole week in parallel ("launches run for a whole week" —
`sources.md` §2.9) — no single slot above; reply as comments arrive on its page.
```

**3 — `## Launch-morning checklist`.** Anchor: the line beginning `Filled in step 5 — T-1
(after Release)`.

```markdown
## Launch-morning checklist

One command or URL per check. `<reviewed-sha>` is the `dev` SHA `surface-review.md` (step 12)
recorded as reviewed.

### T-1, after Release

- [ ] Production www deploys from the merge: `gh api "repos/ianyimi/vex/deployments?environment=Production%20%E2%80%93%20vex-www" --jq '.[0].sha'` matches `origin/master`'s HEAD.
- [ ] Production docs deploys from the merge: `gh api "repos/ianyimi/vex/deployments?environment=Production%20%E2%80%93%20vex-docs" --jq '.[0].sha'` matches `origin/master`'s HEAD.
- [ ] Only Release mechanics changed since the review: `git diff --stat <reviewed-sha>..origin/master` lists only changeset version bumps, `scripts/sync-template-versions.mjs`'s output files, and `copy-flip.patch`'s files — nothing else.
- [ ] All 8 packages published at `0.1.0`, `latest` tag: `for p in @vexcms/core @vexcms/react @vexcms/next @vexcms/cli @vexcms/better-auth @vexcms/file-storage-convex @vexcms/richtext-plate create-vexcms; do npm view "$p" dist-tags --json; done` — every one's `latest` reads `0.1.0`. If `latest` still reads `0.0.20`, stop: `pnpm create vexcms` would install the old scaffolder (spec.md § Handoffs, Release).
- [ ] Each npm page's README renders (no broken Markdown): open `https://www.npmjs.com/package/<pkg>` for each of the 8 packages above and check the Readme tab renders.
- [ ] GitHub `master` serves the real README: `curl -s https://raw.githubusercontent.com/ianyimi/vex/master/README.md | head -5` shows the slimmed landing-page content, not the alpha banner.
- [ ] Community profile complete: `gh api repos/ianyimi/vex/community/profile --jq .health_percentage` prints `100`.
- [ ] Issue chooser shows the two forms: open `https://github.com/ianyimi/vex/issues/new/choose` and confirm the bug and docs forms, the Discussions and security contact links, and no blank-issue option.
- [ ] Sponsor button renders: open `https://github.com/ianyimi/vex` and confirm the "Sponsor" button is present in the repo header.
- [ ] `v0.1.0` release is Latest: `gh release view v0.1.0 --json isLatest --jq .isLatest` prints `true`.

### D1, 05:30 PT

- [ ] Docs production page renders: `curl -sI https://docs.vexcms.dev/ | head -1` returns `200`.
- [ ] www production page renders: `curl -sI https://vexcms.dev/ | head -1` returns `200`.
- [ ] Demo loads anonymously: `curl -sI https://vexcms.dev/admin | head -1` returns `200`; open it in a private window and confirm the panel renders read-only with no sign-in prompt.
- [ ] The 4 feature posts 404 anonymously until their day: `curl -sI https://vexcms.dev/posts/real-time-admin-and-live-preview | head -1` returns `404` on D1 (and the same for the other 3 slugs on the days before their publish day).
- [ ] Recap page 404s anonymously until D5: `curl -sI https://vexcms.dev/launch-week | head -1` returns `404` on D1–D4.
- [ ] Uptime monitors and analytics are live: see `.agent/docs/specs/2026-11-06-launch-infrastructure/operations.md`'s monitor table (UptimeRobot keyword/HTTP monitors) and its analytics section.
```

**4 — `## Post-launch routine`.** Anchor: the line beginning `Filled in step 5 — the 14-day
daily sweep`.

```markdown
## Post-launch routine

Every day for 14 days after D1, in this order. Each item lands as a labelled GitHub issue, a
Discussions reply, or a `backlog.md` entry — never only in memory. New issues are triaged
within a week, matching `public-copy.md` § Who builds this.

1. GitHub issues labelled `status: needs-triage` — triage into a `type:`/`area:` label set, or
   reply and leave `needs-repro`. → labelled issue.
2. GitHub Discussions (Q&A, Ideas, Show and tell) — answer Q&A, mark accepted Ideas
   `type: feature` and file an issue for them. → Discussions reply + issue, where accepted.
3. The Show HN thread (D1–D3 only, while live) — reply within the blocked time block; every
   reply hand-written (Design Decision 2). → no artifact beyond the thread itself; file an
   issue for any bug or feature request raised in it.
4. Product Hunt comments (D2–D3 only, while live) — same reply discipline as Show HN. → issue
   for anything actionable.
5. dev.to and Hashnode comments on the cross-posts. → issue or Discussions reply.
6. LinkedIn comments on each day's post. → issue or Discussions reply.
7. Convex Discord #show-and-tell thread. → issue or Discussions reply.
8. DevHunt comments, for the full week its launch runs. → issue or Discussions reply.
9. `hello@vexcms.dev` — sponsorship, partnership, business enquiries, Code of Conduct reports
   (`public-copy.md` § Contact). → reply directly; Code of Conduct reports follow
   `CODE_OF_CONDUCT.md`'s enforcement path, not this log.
10. `security@vexcms.dev` — acknowledge within a week (`public-copy.md` § Security response
    window). → private vulnerability report or a tracked security issue, never a public one.

Every item swept also gets a row in the Feedback log above: date, source, a one-line summary,
and where it landed.
```

Verify: `rg -c '^## Submission list$' .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md` prints `1`, and the table under it has 5 data rows: `rg -A8 '^## Submission list$' .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md | rg -c '^\| [A-Z]'` prints `5`. `rg -c '^\| .* \| D[1-5] ' .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md` prints `14` or more (one row per channel-day pairing in the Schedule table). `rg -c '^- \[ \]' .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md` under the Launch-morning checklist section prints `16`: `rg -A40 '^## Launch-morning checklist$' .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md | rg -c '^- \[ \]'`. `rg -c '^[0-9]+\. ' .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md` under Post-launch routine prints `10`: `rg -A20 '^## Post-launch routine$' .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md | rg -c '^[0-9]+\. '`. Negative test: `cp .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md /tmp/kit-sched.md && sed -i '' '/| 00:01 | D2 Tue | Product Hunt/d' /tmp/kit-sched.md && rg -c '^\| .* \| D2 ' /tmp/kit-sched.md` prints a count one lower than the original file's D2-row count, proving the row-coverage check catches a dropped day; `rm /tmp/kit-sched.md`.

### Step 6 — Hand-written posts and listing copy [dev]

Write every slot in `launch-kit.md` yourself, working from that channel's brief and the fact sheet. No AI generation or AI editing of any slot's text (decision 2). Spell-checkers and grammar tools that only flag issues are fine; anything that rewrites isn't. Where a brief lists a `public-copy.md` string, paste it as is. If you want different wording, change `public-copy.md` first and then every surface, as its header requires.

The www announcement body is public-presence step 14's slot, not this kit's. Make the D1 posts agree with it and link it as the canonical URL.

- [ ] D1 slots: `hn:title`, `hn:text`, `linkedin:d1`, `discord:d1`, `devto:announcement`, `hashnode:announcement`
- [ ] D2–D5 slots: `post:real-time-admin-and-live-preview`, `post:one-config-schema-and-types`, `post:access-control-hooks-validation`, `post:create-vexcms-to-deployed` (title, excerpt, markdown body; each links its clip, the docs page from the fact sheet, the earlier posts of the week, the Funding line and the `planned` issues), and `linkedin:d2` … `linkedin:d5`
- [ ] `page:launch-week` (page title, hero badge, hero heading and subheading, CTA heading and subheading, 5 `action:` lines)
- [ ] Product Hunt slots: `ph:name`, `ph:tagline`, `ph:description`, `ph:maker-comment`, `ph:tags`. Position VexCMS as a working CMS, not a template or boilerplate, which PH doesn't feature (§2.8)
- [ ] `devhunt:listing`, `cooperpress:email`, `twir:note`, `jamstack:description`, `awesome-nextjs:line`
- [ ] dev.to front matter: `ai_disclosure_level` set to the value that is true for your text (§5.13)

#### .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md

No new structure. This step fills every `<!-- slot:… -->` block that step 3 lays out.

Verify: `rg -c "<!-- slot:" .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md` equals the slot count in step 3's template. Every slot has content between its markers (step 7's lint reports empty slots as findings). Step 7's lint log has no open finding.

### Step 7 — Draft lint [agent]

Lint reports and never rewrites (`spec-tasks.md` step 7's Why). It runs over every filled slot
in `launch-kit.md` — each slot wrapped `<!-- slot:<id> -->` … `<!-- /slot -->` on its own lines,
ids `post:<slug>` (the 4 feature-post slugs), `page:launch-week`, `hn:title`, `hn:text`,
`linkedin:d1`…`linkedin:d5`, `discord:d1`, `devto:announcement`, `hashnode:announcement`,
`ph:name`, `ph:tagline`, `ph:description`, `ph:maker-comment`, `ph:tags`, `devhunt:listing`,
`cooperpress:email`, `twir:note`, `jamstack:description`, `awesome-nextjs:line` — the contract
step 3's skeleton writes to and this step reads from. Inside a `post:<slug>` slot the first line
is `title: …`, the second `excerpt: …`, a blank line, then the markdown body; inside
`page:launch-week` the lines are `title:`, `hero.badge:`, `hero.heading:`, `hero.subheading:`,
`cta.heading:`, `cta.subheading:`, then five `action:<label>|<href>` lines.

Two throwaway Node scripts do the mechanical checks; neither is committed (Design Decision 20). Both take the kit path as `argv[2]` and are run from `/tmp`. Results are
copied into the kit's Lint log table (slot, check, result) by hand after each run. Run them from the repo root; `lint-slots.mjs` reads the verbatim strings from public-presence's `public-copy.md`, so the check follows that file instead of a copy.

- [ ] Run `node /tmp/lint-slots.mjs .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md` — character limits, verbatim strings, banned terms, vote solicitation, planning references, dev.to tag count, awesome-nextjs line format, Show HN title shape
- [ ] Run `node /tmp/link-check.mjs .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md` — every URL in the kit except ones listed in its "Not-yet-live URLs" table
- [ ] Record every result in the kit's Lint log table; re-run both scripts after each round of edits until the log is clean
- [ ] Negative test: `cp .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md /tmp/kit-neg.md`, insert a `please upvote` line into the `hn:text` slot of the copy (command below), run `lint-slots.mjs` on the copy and confirm a `vote-solicitation` finding for `hn:text`. Never edit the real kit for this test

**Character limits, with their `sources.md` section:**

| Slot | Limit | Source |
|---|---|---|
| `ph:name` | 40 chars | `sources.md` §2.3 |
| `ph:tagline` | 60 chars | §2.3 |
| `ph:description` | 500 chars | §2.3 |
| `ph:maker-comment` | 5000 chars | §2.3 |
| `devto:announcement` front matter `tags:` | ≤ 4 tags | §5.13 |

#### /tmp/lint-slots.mjs

Length limits, the verbatim-string check against `public-copy.md`'s paid line, licence line and
funding line (read from that file at run time), banned
terms, vote solicitation, planning references (AP-024), dev.to tag count, the awesome-nextjs line
format (§5.7: `[Title Case Name](link) - Description.`, capital start, full stop end), and the
Show HN title shape (§1.1–§1.2: starts `Show HN: `, no `vexcms.dev`, no `!`, no ALL-CAPS word).

```js
#!/usr/bin/env node
import { readFileSync } from "node:fs"

const COPY_PATH = ".agent/docs/specs/2026-11-06-public-presence/public-copy.md"
const copy = readFileSync(COPY_PATH, "utf8")

function copySection(heading) {
  const marker = `## ${heading}\n`
  const start = copy.indexOf(marker)
  if (start === -1) throw new Error(`public-copy.md section missing: ${heading}`)
  return copy.slice(start + marker.length).split(/\n## /)[0].trim().split("\n\n")[0].trim()
}

const PAID_LINE = copySection("Paid-work line")
const LICENCE_LINE = copySection("Licence line")
const FUNDING_LINE = copySection("Funding")

const LIMITS = {
  "ph:name": 40,
  "ph:tagline": 60,
  "ph:description": 500,
  "ph:maker-comment": 5000,
}

const BANNED = /pro tier|agency|enterprise|maprios|\bSSO\b|audit log|co-edit|annual licen|\$[0-9]/i
const VOTE = /upvote|vote for|support us on|boost/i
const PLANNING = /Step [0-9]|Decision [0-9]|P-0[0-9]{2}|AP-0[0-9]{2}|spec /
const ACRONYMS = new Set(["CMS", "API", "CLI", "RBAC", "UI", "SDK", "TS", "JS", "OSS", "HTTP", "JSON", "CRUD", "SQL"])

const path = process.argv[2]
if (!path) {
  console.error("usage: node lint-slots.mjs <launch-kit.md>")
  process.exit(2)
}
const kit = readFileSync(path, "utf8")

function slots(src) {
  const out = new Map()
  const re = /<!-- slot:(\S+) -->\n([\s\S]*?)<!-- \/slot -->/g
  let m
  while ((m = re.exec(src))) out.set(m[1], m[2].trim())
  return out
}

const found = slots(kit)
const rows = []

for (const [id, body] of found) {
  if (id in LIMITS) {
    rows.push([id, "length", body.length > LIMITS[id] ? `finding: ${body.length} > ${LIMITS[id]}` : "pass"])
  }
  rows.push([id, "banned-terms", BANNED.test(body) ? `finding: ${body.match(BANNED)[0]}` : "pass"])
  rows.push([id, "vote-solicitation", VOTE.test(body) ? `finding: ${body.match(VOTE)[0]}` : "pass"])
  rows.push([id, "planning-reference", PLANNING.test(body) ? `finding: ${body.match(PLANNING)[0]}` : "pass"])
}

if (found.has("hn:title")) {
  const title = found.get("hn:title")
  const checks = [
    [!title.startsWith("Show HN: "), 'must start "Show HN: "'],
    [/vexcms\.dev/i.test(title), "contains vexcms.dev"],
    [title.includes("!"), "contains !"],
    [(title.replace(/^Show HN: /, "").match(/\b[A-Z]{2,}\b/g) ?? []).some((word) => !ACRONYMS.has(word)), "all-caps word"],
  ]
  for (const [bad, label] of checks) rows.push(["hn:title", label, bad ? "finding" : "pass"])
}

if (found.has("devto:announcement")) {
  const body = found.get("devto:announcement")
  const tagLine = body.split("\n").find((l) => l.startsWith("tags:"))
  const count = tagLine ? tagLine.slice(5).split(",").filter((t) => t.trim()).length : 0
  rows.push(["devto:announcement", "tag-count", count > 4 ? `finding: ${count} tags` : "pass"])
}

if (found.has("awesome-nextjs:line")) {
  const line = found.get("awesome-nextjs:line")
  const ok = /^\[.+\]\(https?:\/\/[^)]+\) - [A-Z].*\.$/.test(line)
  rows.push(["awesome-nextjs:line", "format", ok ? "pass" : "finding: does not match `[Name](link) - Description.`"])
}

for (const [name, text] of [["paid-line", PAID_LINE], ["licence-line", LICENCE_LINE], ["funding-line", FUNDING_LINE]]) {
  let hits = 0
  let mismatches = 0
  const anchor = text.slice(0, 24)
  for (const [, body] of found) {
    let idx = body.indexOf(anchor)
    while (idx !== -1) {
      hits++
      if (body.slice(idx, idx + text.length) !== text) mismatches++
      idx = body.indexOf(anchor, idx + 1)
    }
  }
  rows.push([name, "verbatim", hits === 0 ? "not used" : mismatches > 0 ? `finding: ${mismatches}/${hits} altered` : `pass (${hits})`])
}

for (const [slot, check, result] of rows) console.log(`${slot}\t${check}\t${result}`)
```

#### /tmp/link-check.mjs

Every `https?://` URL in the kit, HTTP-checked with a `HEAD` request (`GET` when a host rejects `HEAD`),
except URLs listed in the kit's "Not-yet-live URLs" table (`| url | live from |` rows — those
resolve only after Release or their D-day and are checked against the Vercel preview instead).

```js
#!/usr/bin/env node
import { readFileSync } from "node:fs"

const path = process.argv[2]
if (!path) {
  console.error("usage: node link-check.mjs <launch-kit.md>")
  process.exit(2)
}
const kit = readFileSync(path, "utf8")

const urls = [...new Set([...kit.matchAll(/https?:\/\/[^\s)\]"'<>]+/g)].map((m) => m[0]))]

const notYetLive = new Set()
const tableRow = /^\|\s*(https?:\/\/\S+?)\s*\|\s*[^|]+\|\s*$/gm
let tm
while ((tm = tableRow.exec(kit))) notYetLive.add(tm[1])

for (const url of urls) {
  if (notYetLive.has(url)) {
    console.log(`SKIP (not-yet-live) ${url}`)
    continue
  }
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow" })
    if (res.status === 405 || res.status === 501) res = await fetch(url, { method: "GET", redirect: "follow" })
    console.log(`${res.status} ${url}`)
  } catch (err) {
    console.log(`ERR ${url} ${err.message}`)
  }
}
```

Negative test commands:

```bash
cp .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md /tmp/kit-neg.md
node -e 'const fs=require("fs"),f="/tmp/kit-neg.md";fs.writeFileSync(f,fs.readFileSync(f,"utf8").replace("<!-- slot:hn:text -->\n","<!-- slot:hn:text -->\nplease upvote\n"))'
node /tmp/lint-slots.mjs /tmp/kit-neg.md | rg "^hn:text\tvote-solicitation\tfinding"
rm /tmp/kit-neg.md
```

Verify: the negative test's `rg` prints one line. On the real kit, every row `lint-slots.mjs` prints is `pass` (or `not used` for a verbatim line no slot quotes), every URL `link-check.mjs` prints is `200` or `SKIP (not-yet-live)`, and the kit's Lint log carries the final run.

### Step 8 — Shared media session: feature clips, demo media, `/tour` screenshots [dev] [blocked: quality-pass steps 6–7]

One recording session captures every frozen image of the UI that ships at launch (cross-spec decision 7). It runs once quality-pass steps 6 (admin views) and 7 (www pages) have landed, so no clip, GIF or screenshot shows a pre-fix screen. It covers three sets:

- **This spec's 4 feature clips**: silent, ≤ 60 s, ≤ 10 MB H.264, one per feature-post slug, in `apps/www/public/launch/`.
- **Public-presence step 16's demo media**: the 30–60 s demo MP4, the looping hero GIF, and the fixed-size screenshots (1280×800 admin, 1280×800 live preview, 390×844 mobile admin, 1270×760 Product Hunt gallery). Their placement in `apps/www/public/brand/`, the `/brand` CTA actions and the README hero follow public-presence step 16's own checklist; this step only records them in the same session.
- **The 4 `/tour` screenshots** that launch-infrastructure step 10 shipped with pre-fix captures: dashboard, list view with a saved view, edit view with live preview, media library. Recaptured at 1280×800 and copied into both `apps/www/public/tour/` and `apps/test/public/tour/`, overwriting the files step 10 shipped under the same names.

Attach to the developer's already running `apps/www` dev server on `:3030` (P-024 — never start one) and the Convex dev deployment it's wired to; nothing here starts a server. Re-seed the dev deployment first (`pnpm --filter www exec convex run seed:reinit`, cross-spec decision 9) so the recorded content is the seeded copy.

- [ ] Record `real-time-admin-and-live-preview.mp4`, `one-config-schema-and-types.mp4`, `access-control-hooks-validation.mp4`, `create-vexcms-to-deployed.mp4` as raw `.mov`/`.mp4` captures
- [ ] Encode each with the command below; `ffprobe` each result for duration, codec and no audio stream; check file size
- [ ] Place the 4 encoded files at `apps/www/public/launch/<slug>.mp4`
- [ ] Record public-presence step 16's demo take, GIF and screenshots in the same session; hand the files to that step's checklist
- [ ] Recapture the 4 `/tour` screenshots at 1280×800 and copy each into `apps/www/public/tour/` and `apps/test/public/tour/` under the file names launch-infrastructure step 10 used

**Shot list skeleton, one row per clip — what to show, from which running surface:**

| Slug | Shows | From |
|---|---|---|
| `real-time-admin-and-live-preview` | Open a document in the admin with the live-preview pane open; edit a field; the preview pane updates without a manual refresh | `:3030/admin` (an existing page/post's edit view), live preview iframe pointed at that document's public route |
| `one-config-schema-and-types` | A collection's `defineCollection` call in an editor; `pnpm --filter www exec vex generate` running in a terminal; the generated `Post`/`Page` type; the admin form rendering the same fields | An editor window on `apps/www/src/vexcms/collections/*.ts`, a terminal, `:3030/admin` |
| `access-control-hooks-validation` | The `access.ts` matrix for a resource; a restricted role attempting a write and getting a server-enforced rejection (toast/error), then an admin role performing the same write successfully | An editor window on `apps/www/src/auth/access.ts`, `:3030/admin` under two different signed-in sessions |
| `create-vexcms-to-deployed` | `pnpm create vexcms …` scaffolding a project end to end in a terminal, then the scaffolded site open in a browser | A terminal in an empty directory, the scaffolded app's dev server (per P-024, this one *is* a fresh scaffold's own first run, not the developer's existing `apps/www`/`apps/test` servers) |

**Encoding, run once per raw capture:**

```bash
ffmpeg -i in.mov -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart -vf scale=1280:-2 -t 60 out.mp4
```

**Verification per file:**

```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 out.mp4
ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 out.mp4
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 out.mp4
stat -f%z out.mp4
```

The duration line must be `≤ 60`; the audio-stream line must print nothing (no audio stream); the
codec line must print `h264`; the size line must print `≤ 10485760` (10 MB). Drop `scale` to
`960:-2` and re-encode if size is still over budget.

#### apps/www/public/launch/

Four files, none of them code: `real-time-admin-and-live-preview.mp4`,
`one-config-schema-and-types.mp4`, `access-control-hooks-validation.mp4`,
`create-vexcms-to-deployed.mp4` — produced by the encoding command above, not hand-written.

#### apps/www/public/tour/

The 4 recaptured 1280×800 PNGs, replacing launch-infrastructure step 10's files under the same names. `/tour` is `force-static`, so the new images ship with the next build.

#### apps/test/public/tour/

The same 4 PNGs, byte-identical to `apps/www/public/tour/` (`apps/test` stays a superset of www).

Verify: `ffprobe` on each clip shows no audio stream, H.264, duration ≤ 60 s; each clip is ≤ 10 MB; `curl -sI http://localhost:3030/launch/<file>.mp4` returns `200` (static files, served without seeding). `sips -g pixelWidth -g pixelHeight apps/www/public/tour/*.png` prints 1280 × 800 for all 4. `diff -r apps/www/public/tour apps/test/public/tour` prints nothing. `/tour` on :3030 shows the new screenshots. Public-presence step 16's own Verify passes on the media this session produced.

### Step 9 — Seed the launch-week posts and recap page [agent] [blocked: public-presence step 14 (www posts); apps/test after the telemetry commit]

**Slot markers this step relies on.** `post:<slug>` and `page:launch-week`, exactly as step 3's
skeleton and step 7's lint already use them (see Step 7 above) — the verbatim check below reads
the same markers it writes nothing to.

**Transcription rules.** Agents never write prose (Design Decision 2); this step only moves the
developer's already-written markdown from a kit slot into Plate JSON, unreworded. Node shapes are
`packages/richtext-plate/src/test/fixtures.ts`'s `PLATE_52_DOCUMENT`:

| Markdown | Plate node |
|---|---|
| `## Heading` | `{ type: "h2", children: [{ text: "Heading" }] }` |
| A paragraph | `{ type: "p", children: [{ text: "…" }] }` |
| `**bold**` inside a paragraph | a child `{ bold: true, text: "…" }` alongside plain-text siblings in the same `children` array (see the fixture's `p` node mixing plain/bold/italic children) |
| `[text](url)` | a child node `{ type: "a", url: "<url>", children: [{ text: "text" }] }` inside the paragraph's `children` |
| A bullet/numbered list item | a `p` node with `indent: 1`, `listStyleType: "disc"` (bullets) or `listStart: <n>` (numbered), one node per item — the fixture has no blockquote/list markdown source to confirm beyond this, so anything beyond flat bullets is a P-023 report |

Anything in the kit's markdown that doesn't map to a row above (tables, nested lists, images,
code fences) is a P-023 report to the developer before improvising a shape — never guessed, never
reworded.

- [ ] `apps/www/convex/seed.ts`: a file-local `launchWeekPosts` array (4 draft posts) and a loop in `runSeed` that inserts/patches/skips them by the announcement's locator pattern; a draft `launch-week` page (Hero compact + CTA, 5 actions). No footer or `socialLinks` entry: the recap page is reached from the posts and LinkedIn, not the footer (cross-spec decision 4; Design Decision 10)
- [ ] `apps/test/convex/seed.ts`: the same two additions, run only after the telemetry work in `apps/test` is committed
- [ ] `apps/www/e2e/routes.ts`: the 4 post routes and `/launch-week` added to `QUALITY_ROUTES` with `draft: true`, if the file exists (cross-spec decision 3)
- [ ] Draft audit before L: publish the 5 documents on the dev deployment, run quality-pass's suite with `CI` unset, record the result in quality-pass `findings.md`, unpublish
- [ ] The verbatim-check script, run after transcription and after every edit to either the kit or the seeded documents

#### apps/www/convex/seed.ts

4 edits: the `launchWeekPosts` array (new, file-local), an import addition, a loop in `runSeed`
beside the announcement post block (public-presence step 14), and the `launch-week` page block.
Everything else in the file — including `TABLE_SLUG_POSTS` in the `~/db/constants` import and the
announcement post's own insert block — already exists once public-presence step 14 has landed.

**1 — `launchWeekPosts`, a file-local constant beside `THEME_PRESETS`** (after its closing `]`,
before the `SeedMode` type). Each body is a two-node placeholder — `h2` repeating the post title,
then a `p` naming the exact slot the transcription replaces it with — matching the shape
public-presence step 14's own `announcementPostDoc` placeholder already uses, so the agent running
the transcription has one consistent pattern to find and replace across all 5 posts. Step 9 runs
after step 6, so the agent replaces every `PLACEHOLDER` (`title`, `excerpt`, `body`) with the
slot's content in the same change; the placeholders show the structure only and never reach a
deployment (`rg -n PLACEHOLDER apps/www/convex/seed.ts` prints nothing for these documents):

```ts
const launchWeekPosts: Array<WithoutSystemFields<Doc<typeof TABLE_SLUG_POSTS>>> = [
  {
    title: "Real-time admin and live preview",
    slug: "real-time-admin-and-live-preview",
    excerpt: "PLACEHOLDER — replace with the verbatim slot:post:real-time-admin-and-live-preview excerpt line from launch-kit.md.",
    vex_status: "draft",
    body: [
      { type: "h2", children: [{ text: "Real-time admin and live preview" }] },
      {
        type: "p",
        children: [
          {
            text: "PLACEHOLDER — replace with the verbatim transcription of slot:post:real-time-admin-and-live-preview's body from launch-kit.md before publishing.",
          },
        ],
      },
    ],
  },
  {
    title: "One config, schema and types",
    slug: "one-config-schema-and-types",
    excerpt: "PLACEHOLDER — replace with the verbatim slot:post:one-config-schema-and-types excerpt line from launch-kit.md.",
    vex_status: "draft",
    body: [
      { type: "h2", children: [{ text: "One config, schema and types" }] },
      {
        type: "p",
        children: [
          {
            text: "PLACEHOLDER — replace with the verbatim transcription of slot:post:one-config-schema-and-types's body from launch-kit.md before publishing.",
          },
        ],
      },
    ],
  },
  {
    title: "Access control, hooks and validation",
    slug: "access-control-hooks-validation",
    excerpt: "PLACEHOLDER — replace with the verbatim slot:post:access-control-hooks-validation excerpt line from launch-kit.md.",
    vex_status: "draft",
    body: [
      { type: "h2", children: [{ text: "Access control, hooks and validation" }] },
      {
        type: "p",
        children: [
          {
            text: "PLACEHOLDER — replace with the verbatim transcription of slot:post:access-control-hooks-validation's body from launch-kit.md before publishing.",
          },
        ],
      },
    ],
  },
  {
    title: "create-vexcms to deployed",
    slug: "create-vexcms-to-deployed",
    excerpt: "PLACEHOLDER — replace with the verbatim slot:post:create-vexcms-to-deployed excerpt line from launch-kit.md.",
    vex_status: "draft",
    body: [
      { type: "h2", children: [{ text: "create-vexcms to deployed" }] },
      {
        type: "p",
        children: [
          {
            text: "PLACEHOLDER — replace with the verbatim transcription of slot:post:create-vexcms-to-deployed's body from launch-kit.md before publishing.",
          },
        ],
      },
    ],
  },
]
```

**2 — the insert/patch/skip loop, added to `runSeed` immediately after the announcement post's
own block** (the one ending `created.push("post:vexcms-0-1-0")` / its `skipped`/`patched`
counterparts), before whatever `runSeed` does next. Each post is draft-only like the announcement,
so it uses the same collect-then-prefer-non-draft locator — a status-filtered `.first()` would
never match a draft-only row and would insert a duplicate on every `seed:reinit`:

```ts
  for (const postDoc of launchWeekPosts) {
    const rows = await ctx.db
      .query(TABLE_SLUG_POSTS)
      .withIndex("by_slug", (q) => q.eq("slug", postDoc.slug))
      .collect()
    const existingPost = rows.find((row) => row.vex_status !== "draft") ?? rows[0]
    if (existingPost) {
      if (mode === "patch") {
        await ctx.db.patch(TABLE_SLUG_POSTS, existingPost._id, postDoc)
        patched.push(`post:${postDoc.slug}`)
      } else {
        skipped.push(`post:${postDoc.slug}`)
      }
    } else {
      await ctx.db.insert(TABLE_SLUG_POSTS, postDoc)
      created.push(`post:${postDoc.slug}`)
    }
  }
```

**3 — the `launch-week` page block**, added right after the loop above. It mirrors the brand
page's block shape (Hero compact + CTA, step 13 of `public-presence`) but — since this page is
also seeded as a draft — uses the same collect-then-prefer-non-draft locator as the posts loop
above, not the brand page's `.filter(q => q.neq("vex_status", "draft"))`, which only works for a
page seeded already-published:

```ts
  const launchWeekRows = await ctx.db
    .query(TABLE_SLUG_PAGES)
    .withIndex("by_slug", (q) => q.eq("slug", "launch-week"))
    .collect()
  const existingLaunchWeekPage = launchWeekRows.find((row) => row.vex_status !== "draft") ?? launchWeekRows[0]
  const launchWeekPageDoc: WithoutSystemFields<Doc<typeof TABLE_SLUG_PAGES>> = {
    title: "PLACEHOLDER — replace with the verbatim slot:page:launch-week title line from launch-kit.md.",
    slug: "launch-week",
    vex_status: "draft",
    blocks: [
      {
        blockType: BLOCK_SLUG_HERO,
        blockName: "Hero",
        id: "launch-week-hero",
        variant: ["compact"],
        badgeText: "PLACEHOLDER — replace with the verbatim slot:page:launch-week hero.badge line from launch-kit.md.",
        heading: "PLACEHOLDER — replace with the verbatim slot:page:launch-week hero.heading line from launch-kit.md.",
        subheading: "PLACEHOLDER — replace with the verbatim slot:page:launch-week hero.subheading line from launch-kit.md.",
      },
      {
        blockType: BLOCK_SLUG_CTA,
        blockName: "Call to Action",
        id: "launch-week-recap",
        heading: "PLACEHOLDER — replace with the verbatim slot:page:launch-week cta.heading line from launch-kit.md.",
        subheading: "PLACEHOLDER — replace with the verbatim slot:page:launch-week cta.subheading line from launch-kit.md.",
        actions: [
          { label: "PLACEHOLDER — action 1 label", href: "/posts/vexcms-0-1-0" },
          { label: "PLACEHOLDER — action 2 label", href: "/posts/real-time-admin-and-live-preview" },
          { label: "PLACEHOLDER — action 3 label", href: "/posts/one-config-schema-and-types" },
          { label: "PLACEHOLDER — action 4 label", href: "/posts/access-control-hooks-validation" },
          { label: "PLACEHOLDER — action 5 label", href: "/posts/create-vexcms-to-deployed" },
        ],
      },
    ],
  }
  if (existingLaunchWeekPage) {
    if (mode === "patch") {
      await ctx.db.patch(TABLE_SLUG_PAGES, existingLaunchWeekPage._id, launchWeekPageDoc)
      patched.push("page:launch-week")
    } else {
      skipped.push("page:launch-week")
    }
  } else {
    await ctx.db.insert(TABLE_SLUG_PAGES, launchWeekPageDoc)
    created.push("page:launch-week")
  }
```

Verify: `pnpm --filter www typecheck && pnpm --filter www test`. After `pnpm --filter www exec convex run seed:reinit` on dev (cross-spec decision 9; patch mode), each post opens as a draft and renders in live
preview at `/posts/<slug>`; anonymous requests 404. Re-running `seed:reinit` creates no duplicates
(the collect-then-prefer-non-draft locator matches the row it already inserted). Patch mode rewrites every
field from the seed, `vex_status` included, which is why each launch-day publish changes the seed's
`vex_status` in the same edit (Design Decision 8).

#### apps/test/convex/seed.ts

`apps/test` already declares its own `posts` collection (`apps/test/src/vexcms/collections/posts.ts`)
for the versioning-drafts test surface — `title`, `slug`, `body`, plus the test-only relationship
fields `relatedPost`/`relatedArticle`/`relatedField`. It does not declare `excerpt` or `ogImage`,
unlike the new collection public-presence step 14 adds to `apps/www`. This is flagged to the
developer, not silently special-cased (P-023): mirroring "the same documents" verbatim would mean
inserting an `excerpt` field Convex's generated schema for `apps/test`'s `posts` table never
declares, which fails at insert time. Until the developer decides to widen `apps/test`'s `posts`
collection to a true superset (adding `excerpt`/`ogImage` there, which this spec does not touch),
the mirror below seeds only the fields `apps/test`'s collection actually has: `title`, `slug`,
`body`, `vex_status`. The relationship fields are optional and are left unset, exactly as the
existing `apps/test` posts the collection's own test fixtures already do.

3 edits. **1 — add `TABLE_SLUG_POSTS` to the `~/db/constants` import**, alphabetically between
`TABLE_SLUG_PAGES` and `TABLE_SLUG_TESTIMONIALS`:

```ts
import {
  GLOBAL_SLUG_SITE_SETTINGS,
  TABLE_SLUG_FOOTERS,
  TABLE_SLUG_HEADERS,
  TABLE_SLUG_PAGES,
  TABLE_SLUG_POSTS,
  TABLE_SLUG_TESTIMONIALS,
  TABLE_SLUG_THEMES,
  TESTIMONIAL_SOURCES,
} from "~/db/constants"
```

**2 — the same `launchWeekPosts` array as `apps/www/convex/seed.ts`**, minus `excerpt` (per the
note above), placed the same way (file-local, beside `THEME_PRESETS`), and **3 — the same posts
loop and `launch-week` page block**, inserted after the existing `page:roadmap` block (the one
ending `created.push("page:roadmap")`), before the `// ── TEST-ONLY: editorial fixtures` section.
`BLOCK_SLUG_HERO`/`BLOCK_SLUG_CTA` are already imported here.

Verify: `pnpm --filter test typecheck && pnpm --filter test test`. Same checks as `apps/www` above,
re-seeding with `pnpm --filter test exec convex run seed:reinit`.

#### apps/www/e2e/routes.ts

Cross-spec decision 3: the file exports `QUALITY_ROUTES: { path, draft?: true }[]`, and CI (`CI` set)
skips `draft` routes. If quality-pass step 2 has created the file by the time this step runs, add these
5 entries to `QUALITY_ROUTES` after public-presence's `/posts/vexcms-0-1-0` entry. If the file doesn't
exist yet, skip this: quality-pass `inventory.md` already lists the routes.

```ts
  { path: "/posts/real-time-admin-and-live-preview", draft: true },
  { path: "/posts/one-config-schema-and-types", draft: true },
  { path: "/posts/access-control-hooks-validation", draft: true },
  { path: "/posts/create-vexcms-to-deployed", draft: true },
  { path: "/launch-week", draft: true },
```

**Draft audit, before L (step 12).** Each draft is audited through the record's procedure:

1. Publish the 5 documents from the admin on the dev deployment.
2. Run quality-pass's Playwright axe and width suites against local www with `CI` unset, so the `draft` routes run.
3. Record the result for each route in `.agent/docs/specs/2026-11-06-quality-pass/findings.md`, the shared audit ledger.
4. Unpublish all 5 on the dev deployment (or re-seed with `seed:reinit`, which restores the seeded `vex_status: "draft"`).

Each `draft: true` stays until that document's launch-day publish. Then the same edit that sets its seed `vex_status` to `"published"` removes the flag (the schedule's daily `www` rows in step 5).

Verify: `rg -c 'draft: true' apps/www/e2e/routes.ts` counts these 5 entries (plus any other spec's drafts). With `CI=1`, the suite's run list excludes them; with `CI` unset it includes them. `findings.md` has a dated row per route from the draft audit.

#### /tmp/verbatim-check.mjs

**Verbatim check**, run after transcription and after any later edit to either the kit or the
seeded documents. Reads two Convex data exports and the kit, extracts text leaves per post slug
and the recap page's Hero/CTA fields, normalizes markdown syntax out of the kit's slot text, and
diffs. Run from `/tmp`, not committed:

```bash
pnpm --filter www exec convex data posts --format jsonArray > /tmp/posts.json
pnpm --filter www exec convex data pages --format jsonArray > /tmp/pages.json
node /tmp/verbatim-check.mjs .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md /tmp/posts.json /tmp/pages.json
```

```js
#!/usr/bin/env node
import { readFileSync } from "node:fs"

const [kitPath, postsPath, pagesPath] = process.argv.slice(2)
if (!kitPath || !postsPath || !pagesPath) {
  console.error("usage: node verbatim-check.mjs <launch-kit.md> <posts.json> <pages.json>")
  process.exit(2)
}

const POST_SLUGS = [
  "real-time-admin-and-live-preview",
  "one-config-schema-and-types",
  "access-control-hooks-validation",
  "create-vexcms-to-deployed",
]

function readSlot(kit, id) {
  const open = `<!-- slot:${id} -->`
  const close = "<!-- /slot -->"
  const start = kit.indexOf(open)
  if (start === -1) throw new Error(`slot not found: ${id}`)
  const end = kit.indexOf(close, start)
  if (end === -1) throw new Error(`slot never closed: ${id}`)
  return kit.slice(start + open.length, end).trim()
}

function normalize(markdown) {
  return markdown
    .replace(/^#+\s*/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim()
}

function leaves(node, out = []) {
  if (Array.isArray(node)) {
    for (const child of node) leaves(child, out)
  } else if (node && typeof node === "object") {
    if (typeof node.text === "string") out.push(node.text)
    if (Array.isArray(node.children)) leaves(node.children, out)
  }
  return out
}

const kit = readFileSync(kitPath, "utf8")
const posts = JSON.parse(readFileSync(postsPath, "utf8"))
const pages = JSON.parse(readFileSync(pagesPath, "utf8"))

let failed = false

for (const slug of POST_SLUGS) {
  const row = posts.find((p) => p.slug === slug)
  if (!row) {
    console.log(`MISSING ${slug} (not in posts export)`)
    failed = true
    continue
  }
  const slotBody = readSlot(kit, `post:${slug}`)
  const [head, ...rest] = slotBody.split("\n\n")
  const headLines = head.split("\n")
  const kitTitle = headLines.find((l) => l.startsWith("title:"))?.slice("title:".length).trim() ?? ""
  const kitExcerpt = headLines.find((l) => l.startsWith("excerpt:"))?.slice("excerpt:".length).trim() ?? ""
  const pairs = [
    ["title", kitTitle, row.title ?? ""],
    ["body", normalize(rest.join("\n\n")), normalize(row.body.map((block) => leaves(block).join("")).join(" "))],
  ]
  if ("excerpt" in row) pairs.push(["excerpt", kitExcerpt, row.excerpt ?? ""])
  for (const [name, kitValue, seedValue] of pairs) {
    if (kitValue === seedValue) {
      console.log(`OK ${slug} ${name}`)
    } else {
      console.log(`DIFF ${slug} ${name}`)
      console.log(`  kit:  ${kitValue}`)
      console.log(`  post: ${seedValue}`)
      failed = true
    }
  }
}

const recap = pages.find((p) => p.slug === "launch-week")
if (!recap) {
  console.log("MISSING page:launch-week (not in pages export)")
  failed = true
} else {
  const kitLines = readSlot(kit, "page:launch-week")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  const field = (prefix) => kitLines.find((l) => l.startsWith(prefix))?.slice(prefix.length).trim() ?? ""
  const hero = recap.blocks.find((b) => b.blockType === "hero")
  const cta = recap.blocks.find((b) => b.blockType === "cta")
  const checks = [
    ["title", field("title:"), recap.title],
    ["hero.badge", field("hero.badge:"), hero?.badgeText],
    ["hero.heading", field("hero.heading:"), hero?.heading],
    ["hero.subheading", field("hero.subheading:"), hero?.subheading],
    ["cta.heading", field("cta.heading:"), cta?.heading],
    ["cta.subheading", field("cta.subheading:"), cta?.subheading],
  ]
  for (const [name, kitValue, seedValue] of checks) {
    if (normalize(kitValue) === normalize(seedValue ?? "")) {
      console.log(`OK page:launch-week ${name}`)
    } else {
      console.log(`DIFF page:launch-week ${name}`)
      console.log(`  kit:  ${kitValue}`)
      console.log(`  page: ${seedValue}`)
      failed = true
    }
  }
  const kitActions = kitLines.filter((l) => l.startsWith("action:")).map((l) => l.slice("action:".length).trim())
  const seedActions = (cta?.actions ?? []).map((a) => `${a.label}|${a.href}`)
  if (JSON.stringify(kitActions) === JSON.stringify(seedActions)) {
    console.log("OK page:launch-week actions")
  } else {
    console.log("DIFF page:launch-week actions")
    console.log(`  kit:  ${kitActions.join(", ")}`)
    console.log(`  page: ${seedActions.join(", ")}`)
    failed = true
  }
}

process.exit(failed ? 1 : 0)
```

Negative test: change one word in a post's `post:<slug>` slot in a scratch copy of
`launch-kit.md` (never the real kit between re-runs), re-run the script against that scratch
path — it prints `DIFF <slug> body` with the altered word visible in the `kit:`/`post:` lines, proving
the check actually compares content rather than just checking presence (AP-013).

Verify: `pnpm --filter www typecheck && pnpm --filter www test`. For all 4 posts (title, excerpt, body) and the recap page (title, badge, hero, CTA, actions), the script prints `OK …` for every check and exits 0. `node
/tmp/verbatim-check.mjs` against a scratch copy with one word changed prints a `DIFF` line.

### Step 10 — Schedule lock and listings [dev] [blocked: items 14–16 landed and L's start date known]

Dates are fixed only when every surface-changing spec has landed: the quality pass, launch infrastructure through N's run-through, and public presence up to (not including) step 18. Then work back from launch:

- L (steps 12–22) takes the days before Release.
- Release is the Sunday (T-1).
- D1 is the Monday.

Product Hunt can be scheduled "from tomorrow up to 30 days ahead" (§2.2), so schedule it at this step for D2. DevHunt sells a launch week (§2.9–2.10). Check where its week boundaries fall at purchase, and pick the week containing D1–D5.

- [ ] Fill the Dates table in `launch-kit.md` (T-1, D1–D5 as calendar dates), plus the Schedule table's date column
- [ ] Product Hunt: create the launch from your personal account. Name, tagline, description and tags come from the `ph:` slots. Logo 240×240 (public-presence handoff above); gallery ≥ 1 image at 1270×760 (public-presence step 16's PH screenshot); pricing **Free**; mark it open source and link `https://github.com/ianyimi/vex`; maker comment from `ph:maker-comment`. Schedule for D2 00:01 PT
- [ ] DevHunt: submit the tool (name, website https://vexcms.dev, `devhunt:listing`, logo, screenshots), then buy the $49 launch for the week containing D1–D5. No super boost
- [ ] jamstack.org: open the newest merged PR that added a file under `src/site/headless-cms/` and copy its frontmatter shape (`sources.md` §5.4, §5.19). Draft `vexcms.md` in the kit's jamstack.org brief (`title`, `homepage`, `twitter` left empty unless an account exists, `opensource: "Yes"`, `typeofcms`, `supportedgenerators`, `description` from `jamstack:description`, `images`). It's submitted on D3 per the schedule
- [ ] awesome-nextjs: confirm the current README category for CMS or tooling entries, and record it beside `awesome-nextjs:line`. One PR, submitted on D3

#### .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md

Fills the Dates table, the Schedule date column, the Product Hunt and DevHunt status rows of the Submission list, and the jamstack.org draft entry.

Verify: the Dates table has no empty cell, and D1 is a Monday (`date -j -f %F <D1> +%A` prints `Monday`). The PH launch page shows "Scheduled" for D2 at 12:01 AM PT. The DevHunt dashboard shows the paid launch for the week containing D1. The jamstack.org draft carries every frontmatter key the reference PR's file has.

### Step 11 — Pre-stage the release-day copy flip [dev]

The patch is built in a scratch worktree so it never touches `dev`'s real history before Release,
and so L (step 21) reviews the exact diff Release will apply.

- [ ] `git worktree add --detach ../vex-flip HEAD` (the `dev` branch is already checked out in this worktree, so the scratch copy is detached); make every edit below inside `../vex-flip`
- [ ] `git -C ../vex-flip diff > .agent/docs/specs/2026-11-06-launch-kit-final-review/copy-flip.patch`
- [ ] `git worktree remove --force ../vex-flip`
- [ ] `git apply --check .agent/docs/specs/2026-11-06-launch-kit-final-review/copy-flip.patch` against `dev` HEAD

**Procedure**, from this worktree's root:

```bash
git worktree add --detach ../vex-flip HEAD
# make the flip edits listed below inside ../vex-flip
git -C ../vex-flip diff > .agent/docs/specs/2026-11-06-launch-kit-final-review/copy-flip.patch
git worktree remove --force ../vex-flip
git apply --check .agent/docs/specs/2026-11-06-launch-kit-final-review/copy-flip.patch
```

Never commit the worktree's edits to `dev` — only the generated `.patch` file is committed, to
this spec's folder. `dev` itself stays on alpha wording until Release applies the patch.

**Scope command**, refined from the spec-tasks draft against hits that are real as of 2026-11-06
(re-run at implementation time — `README.md`'s own content shifts under public-presence's steps
11 and 17, which land before this step):

```bash
rg -n --hidden -g '!**/node_modules/**' -g '!**/CHANGELOG.md' -g '!.changeset/**' -g '!.agent/**' -g '!**/dist/**' \
  -e '@alpha' -e '0\.1\.0-alpha' -e 'alpha' \
  README.md packages/*/README.md packages/*/package.json apps/docs/src apps/docs/astro.config.mjs \
  apps/www/convex/seed.ts apps/www/src apps/test/convex/seed.ts apps/test/src packages/create-vexcms/templates
```

Two categories of hit are excluded, found by actually checking them rather than assuming:

- `packages/*/package.json`'s `"version": "0.1.0-alpha.29"` and `packages/create-vexcms/templates/base-nextjs/package.json`'s `"@vexcms/*": "~0.1.0-alpha.29"` dependency ranges — these are rewritten by Release's own `changeset version` and `scripts/sync-template-versions.mjs`, per Design Decision 14's launch-morning diff check (`git diff --stat <reviewed-sha>..origin/master` expects only those two mechanisms plus this patch). Including them here would make the patch and Release fight over the same lines.
- `apps/docs/src/data/roadmap.json`'s `"version": "0.1.0-alpha"` strings — this file is not imported anywhere under `apps/docs/src` (checked: no `roadmap.json`/`data/roadmap` reference exists in the docs app). It never reaches a rendered page, so it isn't a public surface and isn't in scope.

**`publishConfig.tag` is not flipped by this patch, by design, but it is also not flipped by
anything else today** — this is a gap, not a decision. It is a Release blocker recorded in spec.md § Handoffs (Release), and
step 23 writes it into the launch plan's § Release mechanics tasks. Every package's `package.json` carries `publishConfig: { tag: "alpha" }`, and the root
`package.json`'s `release` script hardcodes `pnpm publish -r --no-git-checks --tag alpha`. Neither
is touched by `changeset pre exit` — that command only exits pre-release mode (collapses the
`-alpha.N` suffix per P-025), it does not change where packages publish. At Release (launch-plan
item 18), the root `release` script's `--tag alpha` must be dropped (or changed to `latest`)
separately from running this patch, and `publishConfig.tag` in each package's `package.json`
updated or removed to match, or the next `pnpm publish` after 0.1.0 reverts to tagging `alpha`
again even with no `--tag` flag on the command line.

**Known flip sites and their edits** (every edit below targets the state public-presence's own
steps 9, 10, 11, 17 and 18 leave the file in — not today's 2026-11-06 content):

#### README.md

Beyond public-presence step 18's two edits (drop the `> [!WARNING]` block; drop `@alpha` from
`## Quick Start`), this step's wider scope (`spec-tasks.md` step 11: "not only the files
public-presence step 18 names") also catches:

**1 — the `**Status:**` badge line**, exact text today: `> **Status:** Vex is in \`alpha\`. APIs
may change between \`0.x\` releases.` → reword without `alpha` (e.g. "0.1.0 is the first stable
release. APIs may change between minor versions.") or remove if step 11/17's rewrite already did.

**2 — every `@alpha` package-install line** beyond the Quick Start command, e.g. `pnpm add
@vexcms/core@alpha @vexcms/react@alpha @vexcms/next@alpha @vexcms/better-auth@alpha
@vexcms/file-storage-convex@alpha better-auth` and `pnpm add -D @vexcms/cli@alpha` — drop every
`@alpha` suffix.

#### packages/core/README.md, packages/next/README.md, packages/react/README.md, packages/richtext-plate/README.md

Not in public-presence step 18's list at all. **1 — every `pnpm add @vexcms/*@alpha` /
`pnpm create vexcms@alpha` install line** in each file — drop `@alpha`.

#### packages/create-vexcms/README.md

Also not in public-presence step 18's list. **1 — the pre-release warning block** (same shape as
root `README.md`'s, "pre-release software, published only under the `alpha` npm dist-tag") —
remove. **2 — every `pnpm create vexcms@alpha` / `pnpm create vexcms@0.1.0-alpha.N` command** —
drop `@alpha`/pin to the released version's install form instead.

#### apps/docs/astro.config.mjs

As public-presence step 18 already specifies: the `starlightLlmsTxt` details line drops
`` `0.1.0-alpha` `` → `` `0.1.0` ``.

#### apps/docs/src/content/docs/guides/quickstart.mdx

As public-presence step 18 already specifies: the scaffold command drops `@alpha`.

#### apps/www/convex/seed.ts and apps/test/convex/seed.ts

As public-presence step 18 already specifies: the `roadmap-stats` third item, the `roadmap-hero`
subheading's "public alpha" phrase, and the FAQ "Is it production ready?" answer. Not the
announcement's `vex_status` (see below). Release re-seeds both apps with `seed:reinit` (cross-spec decision 9) after applying the patch.

#### apps/www/package.json

As public-presence step 18 already specifies: the `vex:update` script drops every `@alpha`
suffix. Mirror in `apps/test/package.json` if it carries the same script.

#### apps/www/src/vexcms/blocks/Hero/config.ts and apps/test/src/vexcms/blocks/Hero/config.ts

As public-presence step 18 already specifies: `badgeText` and `installCommand` `defaultValue`s
drop their alpha wording.

#### apps/www/src/vexcms/blocks/FAQ/config.ts and apps/test/src/vexcms/blocks/FAQ/config.ts

As public-presence step 18 already specifies: the scaffold-command answer drops `@alpha`.

#### apps/www/src/vexcms/blocks/HowItWorks/config.ts and apps/test/src/vexcms/blocks/HowItWorks/config.ts

As public-presence step 18 already specifies: the scaffold-command description drops `@alpha`.

#### packages/create-vexcms/templates/marketing-site/convex/seed.ts

The marketing template's own copy of the same seed data `apps/www/convex/seed.ts` carries — not
named in public-presence step 18, since that step only touches the two apps. **1 — `installCommand`
and `badgeText`** in its Hero block seed data, same strings as `apps/www`'s. **2 — the FAQ
"production ready" answer** ("No. Everything ships as 0.1.0-alpha…") and the roadmap description
line ("…everything ships as 0.1.0-alpha.") — reword without alpha wording, matching whatever
`apps/www`'s own FAQ/roadmap copy reads after its flip. **3 — the roadmap intro paragraph**
("VexCMS is under active development. Everything ships as 0.1.0-alpha…") — same treatment.

#### packages/create-vexcms/templates/marketing-site/src/vexcms/blocks/Hero/config.ts, FAQ/config.ts, HowItWorks/config.ts

The template's copies of the Hero/FAQ/HowItWorks `defaultValue`s — same 3 edits as the
`apps/www`/`apps/test` block configs above, since the template is a hand-maintained mirror of
`apps/www`'s block config (not extracted).

**The announcement stays a draft in the patch** (Design Decision 13). Leave public-presence step 18's
`vex_status: "published"` edit for `post:vexcms-0-1-0` out of the patch. Release runs on T-1, and the
announcement is published from the admin at 06:45 PT on D1, with its seed `vex_status` changed in both
seeds the same day (Design Decision 8). The patch flips wording only.

Verify: `git apply --check .agent/docs/specs/2026-11-06-launch-kit-final-review/copy-flip.patch`
passes on `dev` HEAD. In the scratch worktree with the patch applied, `rg -n "@alpha|0\.1\.0-alpha"
README.md packages/*/README.md apps/docs/src apps/docs/astro.config.mjs apps/www/convex/seed.ts
apps/test/convex/seed.ts apps/www/package.json apps/www/src/vexcms/blocks apps/test/src/vexcms/blocks
packages/create-vexcms/templates` prints nothing outside `packages/*/package.json` version fields
and `packages/create-vexcms/templates/base-nextjs/package.json` dependency ranges (both excluded
above, both owned by Release's own version-bump mechanisms).

### Step 12 — L: inventory refresh, review record, rules re-fetch [agent]

Why: surfaces kept changing across the parallel specs, so the inventory is re-derived from the repo, GitHub and npm right before the read, not copied from this spec's own baseline. The channel rules are re-fetched for the same reason — HN added its generated-text rule in 2026, and `sources.md` records every URL with a fetch date so staleness is visible.

- [ ] `surface-review.md`: run every refresh command below and write the file from the template
- [ ] `sources.md`: re-fetch every URL; append the Re-fetch log; update the affected `launch-kit.md` briefs

The refresh commands, one block per surface category. Run each against the reviewed `dev` SHA (`git rev-parse HEAD`) and paste its output into `surface-review.md`'s "New since baseline" table, cross-checked against the Baseline inventory table.

**www app routes.** Every `page.tsx`, `route.ts` and Next.js special file under `apps/www/src/app`:

```bash
find apps/www/src/app -type f \( \
  -name "page.tsx" -o -name "route.ts" -o -name "layout.tsx" -o -name "default.tsx" \
  -o -name "sitemap.ts" -o -name "robots.ts" -o -name "not-found.tsx" -o -name "error.tsx" \
  -o -name "global-error.tsx" -o -name "opengraph-image.tsx" -o -name "twitter-image.tsx" \
\) | sort
```

**Seeded page slugs and post slugs.**

```bash
rg -o 'slug:\s*"[a-z0-9-]+"' apps/www/convex/seed.ts | sort -u
```

**Header and footer link arrays** (full block context, since the links are nested object literals, not greppable one-per-line):

```bash
rg -n -A30 '"links"\s*:\s*\[|links:\s*\[|socialLinks:\s*\[' apps/www/convex/seed.ts
```

**Docs content files and sidebar config.**

```bash
find apps/docs/src/content/docs -type f \( -name "*.md" -o -name "*.mdx" \) | sort
rg -n "label:|slug:|autogenerate" apps/docs/astro.config.mjs
```

**README files.**

```bash
ls README.md packages/*/README.md packages/create-vexcms/templates/*/README* 2>/dev/null
```

**Published package list and npm dist-tags.** `verify-scaffold.mjs`'s own package filter (`pkg.name && !pkg.private`) is the source of truth for "published":

```bash
node -e '
const fs = require("fs"); const path = require("path");
for (const dir of fs.readdirSync("packages")) {
  const pkgPath = path.join("packages", dir, "package.json");
  if (!fs.existsSync(pkgPath)) continue;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (pkg.name && !pkg.private) console.log(pkg.name, pkg.version, pkg.publishConfig?.tag ?? "latest");
}
'
npm view @vexcms/core dist-tags --json
npm view create-vexcms dist-tags --json
```

**Template files.**

```bash
find packages/create-vexcms/templates -type f \( \
  -iname "README*" -o -name "seed.ts" -o -path "*/src/app/*" \
\) | sort
```

**GitHub surfaces.**

```bash
gh api repos/ianyimi/vex
gh api repos/ianyimi/vex/community/profile
gh label list --repo ianyimi/vex --limit 100 --json name,description,color
gh api graphql -f query='query { repository(owner: "ianyimi", name: "vex") { discussionCategories(first: 20) { nodes { name slug isAnswerable } } } }'
gh issue list --repo ianyimi/vex --label planned --state all --json number,title,labels,state
gh issue list --repo ianyimi/vex --label "good first issue" --state all --json number,title,labels,state
gh release list --repo ianyimi/vex
gh api repos/ianyimi/vex/private-vulnerability-reporting
```

**External pages.** No API exists for these; HEAD-check each and open the Sponsors dashboard and PH draft directly (PH has no public URL before launch):

```bash
curl -sI https://github.com/sponsors/ianyimi | head -1
curl -sI "https://buymeacoffee.com/<bmc-user>" | head -1
curl -sI "https://buttondown.com/<buttondown-user>" | head -1
curl -sI "https://devhunt.org/tool/<devhunt-slug>" | head -1
```

`<bmc-user>`, `<buttondown-user>` come from `public-copy.md`'s recorded usernames (public-presence step 2); `<devhunt-slug>` from `launch-kit.md`'s DevHunt brief (this spec's step 10).

**Preview URLs for the reviewed SHA.**

```bash
REVIEWED_SHA=$(git rev-parse HEAD)
for id in $(gh api "repos/ianyimi/vex/deployments?sha=$REVIEWED_SHA" --jq '.[].id'); do
  gh api "repos/ianyimi/vex/deployments/$id" --jq '"\(.id) \(.environment)"'
  gh api "repos/ianyimi/vex/deployments/$id/statuses" --jq '.[0] | "  \(.state) \(.environment_url)"'
done
```

**Rules re-fetch.** Every URL quoted in `sources.md` §1–§5, refetched and diffed against its quoted excerpt:

```bash
rg -o 'https?://[^\s)]+' .agent/docs/specs/2026-11-06-launch-kit-final-review/sources.md | sort -u
```

Fetch each URL fresh (the harness's own fetch, or `curl -s`), compare the returned text to the quote in `sources.md`, and append one row per URL to the Re-fetch log below. Where a quote no longer matches, update the affected channel brief in `launch-kit.md` (the section the URL's `§n.m` feeds) to the new wording before continuing — `launch-kit.md`'s own structure and slot ids are step 3's; edit only the prose inside the existing brief, never the slot wrapper.

#### .agent/docs/specs/2026-11-06-launch-kit-final-review/sources.md

One edit: append a new top-level section after the existing `### 5.19 Gaps left open at fetch time` entry (the file's last line today).

```markdown
---

## Re-fetch log (L, step 12)

Re-fetched within 7 days of the reviewed SHA. `unchanged` = the quoted excerpt still matches;
`changed` = re-quote it here and update the affected brief in `launch-kit.md` in the same pass.

| URL | § | Date | Status | Note |
|---|---|---|---|---|
| https://news.ycombinator.com/showhn.html | 1.1 |  |  |  |
| https://news.ycombinator.com/newsguidelines.html | 1.2, 1.7 |  |  |  |
| https://news.ycombinator.com/newsfaq.html | 1.3 |  |  |  |
| https://news.ycombinator.com/launches | 1.4 |  |  |  |
| https://news.ycombinator.com/item?id=22336638 | 1.4, 1.7 |  |  |  |
| https://help.producthunt.com/en/articles/17734306-1-how-product-hunt-works | 2.1 |  |  |  |
| https://help.producthunt.com/en/articles/17734355-3-set-your-goals-and-pick-your-launch-date | 2.2 |  |  |  |
| https://help.producthunt.com/en/articles/17834537-4-build-your-product-page | 2.3 |  |  |  |
| https://help.producthunt.com/en/articles/17734384-5-how-to-promote-your-launch-and-what-to-avoid | 2.4 |  |  |  |
| https://help.producthunt.com/en/articles/17734411-7-relaunch-your-product | 2.5 |  |  |  |
| https://help.producthunt.com/en/articles/3615694-community-guidelines | 2.6 |  |  |  |
| https://help.producthunt.com/en/articles/484935-can-i-ask-my-community-friends-family-to-upvote-a-product | 2.7 |  |  |  |
| https://help.producthunt.com/en/articles/9883485-product-hunt-featuring-guidelines | 2.8 |  |  |  |
| https://devhunt.org/faq | 2.9 |  |  |  |
| https://devhunt.org/llms.txt | 2.10 |  |  |  |
| https://cooperpress.com/ | 5.1 |  |  |  |
| https://thisweekinreact.com/ | 5.2 |  |  |  |
| https://github.com/jamstack/jamstack.org | 5.4 |  |  |  |
| https://raw.githubusercontent.com/unicodeveloper/awesome-nextjs/master/CONTRIBUTING.md | 5.7 |  |  |  |
| https://discord.com/invite/nk6C2qTeCq | 5.10 |  |  |  |
| https://dev.to/p/editor_guide | 5.13 |  |  |  |
| https://raw.githubusercontent.com/Hashnode/support/main/docs/write-an-article.md | 5.14 |  |  |  |

(every URL the extraction command above prints gets a row; this is the starting set from §1–§2 and the §5 channels actually in use — §3 Reddit and the unused §4/§5 entries are recorded but re-fetched only if the launch plan changes to use them)
```

Verify: `test -f .agent/docs/specs/2026-11-06-launch-kit-final-review/surface-review.md`. `rg -c "^\|" .agent/docs/specs/2026-11-06-launch-kit-final-review/sources.md` run before and after the edit shows the Re-fetch log table rows added. `rg "^\| http" .agent/docs/specs/2026-11-06-launch-kit-final-review/sources.md | wc -l` matches the count from the URL-extraction command.

#### .agent/docs/specs/2026-11-06-launch-kit-final-review/surface-review.md

```markdown
# Surface review — VexCMS 0.1.0 launch

> The developer's final read-through of every public surface, directly before Release (launch
> plan item 17, L). Nothing changes after step 22 except the Release version bumps and
> `copy-flip.patch`. Every row below is marked `pass` or links an `l-findings.md` row — never
> left blank.

## Review record

- Reviewed `dev` SHA:
- Reviewed date:
- Reviewer:
- `vex-www` preview URL (this SHA):
- `vex-docs` preview URL (this SHA):
- `git diff --stat <reviewed SHA>..origin/master`:

## Baseline inventory

Surfaces this spec's own baseline already names (`spec-tasks.md`'s brief, scout 2026-11-06),
re-confirmed by step 12's refresh commands, plus every surface a parallel spec adds. `new` =
not in this spec's own baseline; its owning spec and step is the source of truth for what it
should contain.

| Surface | Owning spec · step | Baseline / new |
|---|---|---|
| www seeded pages: home, features, roadmap | baseline | baseline |
| www routes: `(frontend)/(site)/[slug]`, `@auth` modal + fallback, `unauthorized`, `(vexcms)/admin/[[...path]]`, `sitemap.ts`, `robots.ts`, `api/vex/revalidate` | baseline | baseline |
| www header links: Features, Roadmap, Docs, GitHub, Get started | baseline | baseline |
| www footer links: Features, Roadmap, Docs, Quickstart, Admin demo, npm, Licence, Convex | baseline | baseline |
| docs: 44 hand-written content files outside `api/` (20 field pages) + TypeDoc `api/**` + llms.txt | baseline | baseline |
| root `README.md`, 8 `packages/*/README.md` | baseline | baseline |
| 8 published packages at a shared alpha version, `publishConfig.tag: alpha` | baseline | baseline |
| `create-vexcms` templates `base-nextjs`, `marketing-site` | baseline | baseline |
| GitHub repo description, topics, `.github/assets/preview.png`, LICENSE + NOTICE | baseline | baseline |
| `/accessibility` www page (seeded, footer link at its `public-copy.md` § Footer position) + docs `apps/docs/src/content/docs/accessibility.md` | quality-pass · step 11 | new |
| Security headers / CSP on www | quality-pass · step 8 | new (not reader-visible; `curl -sI`) |
| `apps/www/e2e/routes.ts` `QUALITY_ROUTES` (draft routes flagged `draft: true`, cross-spec decision 3) | quality-pass · step 2 | new |
| `/tour` static fallback (`apps/www/src/app/tour/page.tsx`, screenshots in `apps/www/public/tour/`, recaptured in this spec's step 8) | launch-infrastructure · step 10; this spec · step 8 | new |
| Admin `error.tsx` fallback (`apps/www/src/app/(vexcms)/admin/error.tsx` → "Demo unavailable" with `/tour` and retry links) | launch-infrastructure · step 10 | new |
| `/privacy` (seeded www page, footer link at its `public-copy.md` § Footer position) | launch-infrastructure · step 13 | new |
| Speed Insights on www | launch-infrastructure · step 11 | new (not reader-visible) |
| Web Analytics on docs | launch-infrastructure · step 12 | new (not reader-visible) |
| `create-vexcms` README + quickstart captured-run text | launch-infrastructure · step 20 | changed |
| `.github/labels.yml`, issue forms, PR template, `config.yml` | public-presence · step 3–4 | new |
| `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md` | public-presence · step 5 | new |
| Discussions (4 categories), private vulnerability reporting, social preview | public-presence · step 6 | new |
| Starter issues (`planned` ×8, `good first issue` ×5+) | public-presence · step 7 | new |
| `.github/FUNDING.yml`, Sponsors profile (4 tiers) | public-presence · step 8 | new |
| Docs roadmap rewrite | public-presence · step 9 | changed |
| www roadmap/FAQ/footer copy | public-presence · step 10 | changed |
| Docs header social links (Sponsor, Buttondown), slim README | public-presence · step 11 | changed |
| Comparison page `apps/docs/src/content/docs/compare.mdx` (`/compare/`) | public-presence · step 12 | new |
| `/brand` page + `apps/www/public/brand/` | public-presence · step 13 | new |
| `/posts/vexcms-0-1-0` announcement (draft until D1) | public-presence · step 14 | new |
| Demo media (hero GIF, screenshots, MP4) on `/brand` + README | public-presence · step 16 | new |
| README quick start (3-command) | public-presence · step 17 | changed |
| `release-notes.md`, `v0.1.0` GitHub Release (not live until Release) | public-presence · step 18 | new |
| `launch-kit.md` (briefs, fact sheet, prepared answers, posts, schedule) | this spec · steps 3–7, 10 | new |
| 4 feature posts `/posts/real-time-admin-and-live-preview`, `/posts/one-config-schema-and-types`, `/posts/access-control-hooks-validation`, `/posts/create-vexcms-to-deployed`, and the `/launch-week` recap page (drafts, live preview only; `draft: true` in `QUALITY_ROUTES`) | this spec · step 9 | new |
| 4 launch clips `apps/www/public/launch/*.mp4` | this spec · step 8 | new |
| `copy-flip.patch` | this spec · step 11 | new (unapplied) |
| Product Hunt listing (scheduled), DevHunt listing (paid) | this spec · step 10 | new (external, no stable URL pre-launch) |

## New since baseline

Re-run step 12's refresh commands against the reviewed SHA; list every surface the commands
found that isn't a row above, with the command and the raw match. Empty is the expected steady
state once every parallel spec has landed; non-empty means re-derive the table above first.

| Command | New surface found | Added to table above? |
|---|---|---|
|  |  |  |

## Docs (step 14)

One row per file `find apps/docs/src/content/docs -name "*.md" -o -name "*.mdx"` lists
(`l-prepass.md` §docs-inventory), plus `apps/docs/src/content/docs/api/**` (TypeDoc).

| File | Pass | Finding |
|---|---|---|
|  |  |  |

Checklist, applied per file:
- [ ] Does every code example on this page compile against today's exports? Open the API page (`/api/<package>/<Symbol>`) for each symbol the example imports and confirm the signature matches.
- [ ] Does every internal link on the page resolve — no 404, no path left over from a rename (`l-prepass.md`'s link check covers this mechanically; re-read any 4xx or redirect-to-login row it lists for this file)?
- [ ] Does the prose describe current behavior, not a planned or removed one (cross-check against the package's current `index.ts` exports, not the page's own narrative)?

`roadmap.md`:
- [ ] Does the Shipped / After-0.1.0 (3 phases) / Not-planned grouping match `public-copy.md`'s Roadmap section verbatim, phase order included?
- [ ] Does every post-0.1.0 item's `planned` issue link resolve to an OPEN issue carrying the `planned` label (`l-prepass.md`'s `gh issue list --label planned` dump)?
- [ ] Does the paid line match `public-copy.md`'s Paid-work line byte for byte?

`compare.mdx`:
- [ ] Is every competitor's check date within 7 days of the reviewed date? Any older date: re-verify that competitor's row against `competitors.md` and update the date before marking this row pass.
- [ ] Does every competitor cell link its cited source, and does that source still say what the cell claims?

`accessibility.md`:
- [ ] Does the stated conformance target and known-exceptions list match `backlog.md`'s current open accessibility findings — not the list as it stood when the page was drafted?

TypeDoc `api/**`:
- [ ] Spot-read the 5 symbols actually referenced from guide/field pages' code examples (not a random sample) — does the rendered signature match the package's current exported type?
- [ ] Does `pnpm --filter docs build` (`l-prepass.md` §docs-build) report zero TypeDoc warnings — `apps/docs/astro.config.mjs`'s `starlightTypedoc` plugin sets `typeDoc.treatWarningsAsErrors: true`, so a non-zero exit here already IS the warning?

`llms.txt`:
- [ ] Fetch `<vex-docs preview URL>/llms.txt` and read the `details` block end to end — does it still describe the config split (`vex.config.ts` / `vex.config.server.ts`), the `vex dev` / `vex generate` codegen flow, and is its alpha wording covered by `copy-flip.patch`?

## READMEs and npm manifests (step 15)

One row per README, plus the packed `package.json` fields (`l-prepass.md` §packed-manifests).

| Package | README pass | Manifest fields pass | Finding |
|---|---|---|---|
| root |  |  |  |
| @vexcms/core |  |  |  |
| @vexcms/react |  |  |  |
| @vexcms/next |  |  |  |
| @vexcms/cli |  |  |  |
| @vexcms/better-auth |  |  |  |
| @vexcms/file-storage-convex |  |  |  |
| @vexcms/richtext-plate |  |  |  |
| create-vexcms |  |  |  |

Checklist, per README:
- [ ] Every relative link and image (`./docs/...`, `../LICENSE`) — does it still resolve once the README is rendered standalone, the way npm renders it (no repo-relative base path)? Read `l-prepass.md`'s packed-README copy — the one npm actually serves — not the source tree's.
- [ ] Do badges resolve, and does the version badge match the reviewed SHA's published or about-to-publish version?
- [ ] Does the install snippet use the exact package name and the correct dist-tag for this point in the release cycle (`l-prepass.md` §version-sweep)?

Checklist, per packed manifest:
- [ ] `description`, `keywords`, `homepage`, `repository`, `license`, `bugs`, `files` all present and non-empty (`l-prepass.md`'s extracted fields)?
- [ ] Does `files` actually include everything the README's usage examples import — no silently-excluded subpath?

## www and launch content (step 16)

Read at 390 px and 1280 px, light and dark, against the `vex-www` preview for the reviewed SHA.

| Surface | 390 light | 390 dark | 1280 light | 1280 dark | Finding |
|---|---|---|---|---|---|
| home |  |  |  |  |  |
| features |  |  |  |  |  |
| roadmap |  |  |  |  |  |
| privacy |  |  |  |  |  |
| accessibility |  |  |  |  |  |
| brand |  |  |  |  |  |
| tour |  |  |  |  |  |
| auth modal + fallback |  |  |  |  |  |
| unauthorized |  |  |  |  |  |
| 404 |  |  |  |  |  |
| announcement (draft, live preview) |  |  |  |  |  |
| feature post ×4 (draft, live preview) |  |  |  |  |  |
| launch-week recap (draft, live preview) |  |  |  |  |  |
| clips ×4 |  |  |  |  |  |

Checklist:
- [ ] At 390 px, does the header collapse to a usable menu with no horizontal overflow?
- [ ] In dark mode, does every block keep readable contrast — spot it against quality-pass's recorded findings (confirm its fix actually shipped, don't re-derive the audit)?
- [ ] `/privacy`: does "what we collect" match what Web Analytics, Speed Insights, the live demo's rate limiter, and the CLI telemetry (linked field list) actually collect today?
- [ ] `/brand`: does every linked file return 200 (`l-prepass.md`'s link check), and does each exported logo look current, not a stale export?
- [ ] `/tour`: do the four static screenshots still match the current admin UI after every quality-pass a11y/contrast fix — a stale fallback screenshot is what a visitor sees the moment the live demo itself is down?
- [ ] Auth modal + fallback: does both signing in and cancelling return to the page you started from?
- [ ] `/unauthorized`: does it explain why and link somewhere useful?
- [ ] Announcement + 4 feature posts + recap: open each as a draft via live preview — does the transcribed body render every paragraph, link and heading from `launch-kit.md`'s `post:<slug>` slots with nothing dropped or garbled (cross-check the step 9 verbatim-check output)?
- [ ] Does each post's clip link (`/launch/<slug>.mp4`) open and play, silent, with the post text describing what the clip shows (no caption track)?
- [ ] Recap page: do the 5 CTA actions point at the announcement + 4 posts, labels matching `launch-kit.md`'s `page:launch-week` slot?

## Live demo (step 17)

Production `/admin` as an anonymous visitor, desktop and phone.

| View | Desktop | Phone | Finding |
|---|---|---|---|
| dashboard |  |  |  |
| list view (saved views, filters, search) |  |  |  |
| edit view |  |  |  |
| media library |  |  |  |
| globals |  |  |  |
| error / tour fallback |  |  |  |

Checklist:
- [ ] Every view renders read-only, with every create/edit/delete affordance hidden or disabled — not present-but-erroring on click. Click a disabled-looking control anyway: does it fail silently, surface a visible error, or (the blocker case) succeed?
- [ ] Open `/tour` directly: do its screenshots match today's admin? Confirm launch-infrastructure step 10's recorded fallback test (Convex unreachable → `/tour`; render error → error boundary link) passed; it can't be reproduced on production without an outage.
- [ ] On phone width, does the sidebar flip behavior hold, and is every control reachable — nothing clipped under a fixed-height overlay?

## Templates (step 18)

Scaffold both templates from the packed tarballs (`l-prepass.md` §packed-manifests,
`node scripts/verify-scaffold.mjs --keep`), against launch-infrastructure's `n-runthrough.md`
Convex projects — reuse those projects, don't create new ones.

| Check | base-nextjs | marketing-site | Finding |
|---|---|---|---|
| prompts + terminal output match README/quickstart |  |  |  |
| scaffolded README |  |  |  |
| first-run screens |  |  |  |
| seeded content |  |  |  |
| marketing-site excludes the vexcms-specific set (cross-spec decision 6) | n/a |  |  |
| footer links (no dead link to a vexcms-only route) |  |  |  |

Checklist:
- [ ] Does the captured prompt/output sequence match word for word what `packages/create-vexcms/README.md` and the docs quickstart quote?
- [ ] Does `create-vexcms` scaffold a README into the marketing-site output? Confirm against the template source directly: `ls packages/create-vexcms/templates/marketing-site/README.md`. `base-nextjs` ships one; if marketing-site does not, decide whether that's the intended first-run experience or a gap.
- [ ] Does the `marketing-site` scaffold exclude everything cross-spec decision 6 lists as vexcms-specific? Expected **absent**: the `posts` collection and `/posts/[slug]` route, `@vexcms/richtext-plate` in its `package.json`, every post document (the announcement and the 4 launch-week posts), and the `privacy`, `accessibility`, `brand` and `launch-week` pages in its seed. Also absent: `/tour` and `public/tour/`; the Privacy, Accessibility, Brand, Discussions, Release emails, Sponsor and Buy Me a Coffee footer links; and the Sponsors `socialLinks` entry. Check against the scaffolded files: `rg -n "launch-week|vexcms-0-1-0|real-time-admin-and-live-preview|TABLE_SLUG_POSTS|richtext-plate|/privacy|/accessibility|/brand|/tour|sponsors/ianyimi|buymeacoffee|buttondown" <marketing-site scaffold>` prints nothing.
- [ ] Does the `marketing-site` roadmap and FAQ read as generic template copy, with no `public-copy.md` string (paid line, roadmap phases, who builds this, funding) (cross-spec decision 6)?
- [ ] Does every footer link the scaffold does render resolve to a route the template ships?
- [ ] Does every CLI flag (`--bare`, `--orgs`, `--monorepo`) still produce what the README describes for it?

## GitHub and external profiles (step 19)

Repo settings are live now; files committed on `dev` go live at the Release merge.

| Surface | Pass | Finding |
|---|---|---|
| repo metadata (description, homepage, topics) |  |  |
| community files on `dev` (read as they'll render on `master` after merge) |  |  |
| labels |  |  |
| issue forms |  |  |
| Discussions (4 categories + pinned welcome post) |  |  |
| private vulnerability reporting |  |  |
| social preview |  |  |
| starter issues (`planned`, `good first issue`) |  |  |
| GitHub Sponsors profile (4 tiers) |  |  |
| Buy Me a Coffee |  |  |
| Buttondown |  |  |
| DevHunt listing |  |  |
| Product Hunt listing (schedule) |  |  |

Checklist:
- [ ] `l-prepass.md`'s `gh api repos/ianyimi/vex --jq .description` dump: does it say "RBAC" or "ABAC"? Does every other surface's wording agree (`l-prepass.md`'s ABAC/RBAC sweep)? A disagreement here is a cross-surface contradiction (step 22's blocker rule).
- [ ] Community files: since GitHub reads them from `master` only, will they read correctly the moment the Release merge lands — not just correctly on `dev` today?
- [ ] Labels: does `gh label list` match `.github/labels.yml` exactly, no orphaned default label left?
- [ ] Issue forms: do the version dropdowns list real, current package versions — not a version pinned when the form was drafted?
- [ ] Discussions: is the pinned welcome post's support-channel line identical to `public-copy.md`'s Support channels section?
- [ ] Starter issues: does every `planned` table row in `public-copy.md` resolve to an open, `planned`-labelled issue; does every `good first issue` carry acceptance criteria a stranger could act on unprompted?
- [ ] Social preview: paste the repo URL into a link unfurler — does the card show the live 1280×640 image, not a placeholder?
- [ ] Sponsors: are all 4 tiers' published text byte-identical to `public-copy.md` (tier text is immutable once published)?
- [ ] DevHunt / PH: does the listing text match `launch-kit.md`'s `devhunt:listing` / `ph:*` slots verbatim? Is the PH launch still "Scheduled" for D2 00:01 PT?

## Launch kit and release notes (step 20)

| Surface | Pass | Finding |
|---|---|---|
| Show HN title + text |  |  |
| LinkedIn ×5 |  |  |
| Convex Discord post |  |  |
| dev.to + Hashnode cross-posts |  |  |
| 4 feature posts |  |  |
| recap page copy |  |  |
| Product Hunt listing |  |  |
| DevHunt listing |  |  |
| prepared-answer fact sheets (≥ 9) |  |  |
| release-notes.md |  |  |

Checklist:
- [ ] Every link inside a kit slot: does `l-prepass.md`'s link check show 200, or a "not-yet-live" row whose `live from` date matches this slot's own schedule row?
- [ ] Every fact claimed in a post or fact sheet: does its citation (file or docs URL) still say what the fact sheet claims — re-read the citation itself, not the fact sheet's paraphrase of it?
- [ ] Every prepared-answer "don't say" list: does it cover every banned term from `l-prepass.md`'s banned-term sweep?
- [ ] `release-notes.md`: does every highlighted feature actually ship at the reviewed SHA, not a still-queued changeset? Do the upgrade notes match the real breaking changes?
- [ ] Every post's funding line + planned-issue links: do they match `public-copy.md`'s Funding section and planned-issue table exactly?

## Consistency matrix (step 21)

Each row must read the same on every surface in its cell set. Fill `match` / `finding` (link
the `l-findings.md` id) / `n/a`. Ground every cell in `l-prepass.md`'s matching sweep — `match`
means "I read both sides and they agree," not "the sweep found nothing."

| Row | Source of truth | docs | www | READMEs | npm | GitHub | templates | launch kit | release notes + listings |
|---|---|---|---|---|---|---|---|---|---|
| version + npm dist-tag | npm registry after Release; `copy-flip.patch` before |  |  |  |  |  |  |  |  |
| install command | `pnpm create vexcms` (post-flip) |  |  |  |  |  |  |  |  |
| package list (8 published) | `packages/*/package.json` without `private` |  |  |  |  |  |  |  |  |
| requirements (Node, Next, React, Convex) | root `engines`, `catalogs.peers` in `pnpm-workspace.yaml` |  |  |  |  |  |  |  |  |
| product one-liner | GitHub description, docs `index.mdx`, www hero (must agree, not be identical) |  |  |  |  |  |  |  |  |
| field-type count | `apps/docs/src/content/docs/fields/` + core field factories |  |  |  |  |  |  |  |  |
| access-control wording (RBAC vs ABAC) | `packages/core/src/access`, `guides/access-control.mdx` |  |  |  |  |  |  |  |  |
| feature claims (real-time, live preview, drafts, richtext, hooks/validation) | shipped list in docs `roadmap.md` |  |  |  |  |  |  |  |  |
| licence line | `public-copy.md` § Licence line |  |  |  |  |  |  |  |  |
| paid-work line + no paid tier/price/customer named | `public-copy.md` § Paid-work line |  |  |  |  |  |  |  |  |
| roadmap order + `planned` issue links | `public-copy.md` § Roadmap — after 0.1.0 |  |  |  |  |  |  |  |  |
| support channel (Discussions, no Discord) | `public-copy.md` § Support channels |  |  |  |  |  |  |  |  |
| contact addresses | `public-copy.md` § Contact |  |  |  |  |  |  |  |  |
| funding links (Sponsors, Buy Me a Coffee) | `public-copy.md` § Funding |  |  |  |  |  |  |  |  |
| follow link (Release emails) | `public-copy.md` § Follow |  |  |  |  |  |  |  |  |
| who builds this + triage window | `public-copy.md` § Who builds this |  |  |  |  |  |  |  |  |
| telemetry wording | `guides/telemetry.mdx` |  |  |  |  |  |  |  |  |
| privacy claims | `/privacy` vs P's analytics, the demo limiter and M's telemetry |  |  |  |  |  |  |  |  |
| accessibility claim | quality-pass findings + `/accessibility` |  |  |  |  |  |  |  |  |
| canonical URLs | `public-copy.md` § Canonical URLs + kit Canonical links |  |  |  |  |  |  |  |  |
| repo URL | `https://github.com/ianyimi/vex` |  |  |  |  |  |  |  |  |

## Copy-flip patch review

- [ ] `git apply --check copy-flip.patch` against the reviewed SHA passes
- [ ] Every hunk only flips alpha wording (version strings, install commands, the FAQ "is it production ready" answer, roadmap stats) — any hunk doing anything else, including the announcement's `vex_status`, is a finding
- [ ] Every alpha string `l-prepass.md`'s version/dist-tag sweep found is covered by a hunk — any sweep hit NOT in the patch is a finding
- [ ] Marked reviewed:

## Sign-off

- Reviewed SHA:
- Signed off by:
- Date:
- Every matrix cell above reads `match` or `n/a`; every row in every section above is `pass` or links an `l-findings.md` finding; `l-findings.md` carries no open `blocker`.
```

Verify: `test -f .agent/docs/specs/2026-11-06-launch-kit-final-review/surface-review.md`. `rg -n "Reviewed \`dev\` SHA:" .agent/docs/specs/2026-11-06-launch-kit-final-review/surface-review.md` prints a match. `rg -c "^\| new \|$|new$" .agent/docs/specs/2026-11-06-launch-kit-final-review/surface-review.md` is non-zero (every parallel-spec surface is marked `new`). Each of these prints at least one inventory row: `for s in '/privacy' '/tour' 'admin/error.tsx' '/accessibility' 'docs/accessibility.md' '/brand' '/posts/vexcms-0-1-0' '/posts/real-time-admin-and-live-preview' '/launch-week' 'compare.mdx'; do rg -c -F "$s" .agent/docs/specs/2026-11-06-launch-kit-final-review/surface-review.md || echo "MISSING $s"; done` prints no `MISSING` line. The refresh commands' output for `apps/www/src/app` lists `tour/page.tsx` and `(vexcms)/admin/error.tsx`. `rg -c "^\|" .agent/docs/specs/2026-11-06-launch-kit-final-review/sources.md` grows by one row per URL the extraction command printed.

### Step 13 — L: evidence pre-pass [agent]

Why: puts the mechanical evidence (strings, links, manifests, settings, scaffolds) next to each `surface-review.md` row so the read-through in steps 14–21 is judgement, not grep. It attaches evidence only — no pass/fail judgement below except where the check is itself mechanical ("banned term found").

- [ ] String sweeps: one command per consistency-matrix row, output appended to `l-prepass.md`
- [ ] Link check: `/tmp/l-link-check.mjs` over every URL on every inventoried surface, plus its negative test
- [ ] Packed manifests and READMEs: `/tmp/l-pack-fields.mjs` over `node scripts/verify-scaffold.mjs --keep`'s tarballs
- [ ] GitHub API dumps: re-run step 12's GitHub commands, full output captured
- [ ] `pnpm --filter docs build`: zero TypeDoc warnings
- [ ] Re-run the step 7 launch-kit lint over every slot in `launch-kit.md`

**String sweeps**, one per consistency-matrix row:

```bash
# version / dist-tag
rg -n "0\.1\.0-alpha|@alpha" README.md packages/*/README.md apps/docs/src/content/docs/roadmap.md \
  apps/docs/src/content/docs/guides/quickstart.mdx apps/www/src/vexcms/blocks/Hero/config.ts apps/www/convex/seed.ts

# install commands (pnpm create vexcms / npm create vexcms / @alpha)
rg -n "pnpm create vexcms|npm create vexcms" README.md packages/create-vexcms/README.md \
  apps/docs/src/content/docs/guides/quickstart.mdx apps/www/src/vexcms/blocks/Hero/config.ts \
  .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md

# licence line
rg -n "Apache-2\.0 licensed" README.md packages/*/README.md apps/www/convex/seed.ts \
  .agent/docs/specs/2026-11-06-public-presence/public-copy.md

# paid line (verbatim)
rg -n "Paid add-ons may come later" README.md apps/www/convex/seed.ts apps/test/convex/seed.ts \
  .agent/docs/specs/2026-11-06-public-presence/public-copy.md

# banned paid terms
rg -ni "pro tier|agency|enterprise|maprios|\bSSO\b|audit log|co-edit|annual licen|\$[0-9]" \
  README.md packages/*/README.md apps/docs apps/www/convex/seed.ts apps/test/convex/seed.ts \
  .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md

# support channel ("Discussions" / "discord")
rg -ni "discussions|discord" README.md apps/docs/src/content/docs apps/www/convex/seed.ts \
  CONTRIBUTING.md SECURITY.md .github/ISSUE_TEMPLATE

# contact addresses
rg -n "hello@vexcms\.dev|security@vexcms\.dev" README.md CONTRIBUTING.md CODE_OF_CONDUCT.md \
  SECURITY.md apps/www/convex/seed.ts .agent/docs/specs/2026-11-06-public-presence/public-copy.md

# funding links
rg -n "github\.com/sponsors/ianyimi|buymeacoffee\.com|buttondown\.com" README.md \
  apps/docs/astro.config.mjs apps/www/convex/seed.ts .github/FUNDING.yml

# roadmap order
rg -n "Plugin system|Localization|Scheduled publishing|TanStack Start adapter|Form builder|Outbound webhooks|API keys and team management|Brownfield adoption" \
  apps/docs/src/content/docs/roadmap.md apps/www/convex/seed.ts \
  .agent/docs/specs/2026-11-06-public-presence/public-copy.md

# field-type count claims
rg -n "[0-9]+ field types" README.md apps/docs/src/content/docs/index.mdx
find apps/docs/src/content/docs/fields -name "*.mdx" | wc -l

# ABAC vs RBAC wording
gh api repos/ianyimi/vex --jq .description
rg -rn "\bABAC\b|\bRBAC\b" README.md apps/docs apps/www/convex/seed.ts .github

# telemetry wording
rg -n "telemetry" README.md apps/docs/src/content/docs/guides/telemetry.mdx apps/www/convex/seed.ts \
  packages/cli/README.md

# accessibility claim
rg -n "WCAG|accessib" README.md apps/www/convex/seed.ts apps/docs/src/content/docs/accessibility.md

# triage window ("within a week")
rg -n "within a week" CONTRIBUTING.md SECURITY.md README.md \
  .agent/docs/specs/2026-11-06-public-presence/public-copy.md

# repo URL
rg -n "github\.com/ianyimi/vex" README.md packages/*/package.json apps/docs/astro.config.mjs .github/FUNDING.yml

# follow link (Release emails) and who builds this
rg -n "buttondown\.com|Release emails" README.md apps/docs/astro.config.mjs apps/www/convex/seed.ts
rg -n "built and maintained by one developer" README.md apps/www/convex/seed.ts .agent/docs/specs/2026-11-06-public-presence/public-copy.md

# product one-liner and requirements
gh api repos/ianyimi/vex --jq .description
rg -n "^description:" apps/docs/src/content/docs/index.mdx
rg -n "\"description\"|\"engines\"" package.json packages/*/package.json
rg -n -A8 "^  peers:" pnpm-workspace.yaml
```

**Link check.** Before running it, build docs so `apps/docs/dist/**/*.html` exists:

```bash
pnpm --filter docs build
node /tmp/l-link-check.mjs
```

#### /tmp/l-link-check.mjs

```javascript
#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const root = process.cwd();
const negativeTest = process.argv.includes("--negative-test");

const SOURCES = [
  "apps/docs/dist",
  "README.md",
  "packages",
  "apps/www/convex/seed.ts",
  "apps/test/convex/seed.ts",
  ".agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md",
];

const URL_PATTERN = /https?:\/\/[^\s)"'<>\]]+/g;
const LOGIN_PATTERN = /\b(login|signin|sign-in|accounts\.google|auth0)\b/i;

function walk(dir, exts, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      walk(full, exts, out);
      continue;
    }
    if (exts.includes(extname(entry.name))) out.push(full);
  }
  return out;
}

function collectFiles() {
  const files = [];
  for (const source of SOURCES) {
    const full = join(root, source);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (!st.isDirectory()) {
      files.push(full);
      continue;
    }
    if (source === "packages") {
      for (const name of readdirSync(full)) {
        const readme = join(full, name, "README.md");
        try {
          statSync(readme);
          files.push(readme);
        } catch {}
        const templatesDir = join(full, name, "templates");
        try {
          if (statSync(templatesDir).isDirectory()) {
            files.push(...walk(templatesDir, [".md", ".mdx", ".ts", ".tsx"]));
          }
        } catch {}
      }
      continue;
    }
    files.push(...walk(full, [".html"]));
  }
  return files;
}

function extractUrls(files) {
  const urls = new Set();
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const match of text.matchAll(URL_PATTERN)) {
      urls.add(match[0].replace(/[.,;:]+$/, ""));
    }
  }
  return [...urls].sort();
}

function parseNotYetLive() {
  const kitPath = join(
    root,
    ".agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md"
  );
  let text;
  try {
    text = readFileSync(kitPath, "utf8");
  } catch {
    return new Map();
  }
  const section = text.split(/^#{2,3} Not-yet-live URLs$/m)[1];
  if (!section) return new Map();
  const table = section.split(/^#{2,3} /m)[0];
  const notYetLive = new Map();
  for (const line of table.split("\n")) {
    const cells = line.split("|").map((cell) => cell.trim()).filter(Boolean);
    if (cells.length < 2 || !/^https?:\/\//.test(cells[0])) continue;
    notYetLive.set(cells[0], cells[1]);
  }
  return notYetLive;
}

async function checkUrl(url) {
  try {
    let response = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, { method: "GET", redirect: "follow" });
    }
    return {
      url,
      status: response.status,
      finalUrl: response.url,
      redirectedToLogin: LOGIN_PATTERN.test(response.url),
    };
  } catch (error) {
    return { url, status: 0, finalUrl: null, error: String(error) };
  }
}

async function main() {
  const files = collectFiles();
  const urls = extractUrls(files);
  const notYetLive = parseNotYetLive();

  if (negativeTest) {
    urls.push("https://vexcms.dev/__l-link-check-negative-test__");
  }

  const results = [];
  for (const url of urls) {
    if (notYetLive.has(url)) {
      results.push({ url, status: "not-yet-live", liveFrom: notYetLive.get(url) });
      continue;
    }
    results.push(await checkUrl(url));
  }

  const flagged = results.filter(
    (result) =>
      typeof result.status === "number" && (result.status >= 400 || result.redirectedToLogin)
  );

  console.log(`checked ${results.length} URL(s) from ${files.length} file(s)`);
  console.log(`flagged ${flagged.length}:`);
  for (const result of flagged) {
    console.log(
      `  ${result.status} ${result.url}${
        result.redirectedToLogin ? ` -> login (${result.finalUrl})` : ""
      }`
    );
  }
  console.log(JSON.stringify(results, null, 2));
}

await main();
```

Negative test, proving the checker reports a dead link (AP-013), run once and then dropped:

```bash
node /tmp/l-link-check.mjs --negative-test | rg "404 https://vexcms\.dev/__l-link-check-negative-test__"
```

**Packed manifests and READMEs.**

```bash
node /tmp/l-pack-fields.mjs
```

#### /tmp/l-pack-fields.mjs

```javascript
#!/usr/bin/env node
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const evidenceRoot = "/tmp/l-pack-evidence";
mkdirSync(evidenceRoot, { recursive: true });

const output = execSync("node scripts/verify-scaffold.mjs --keep", {
  cwd: root,
  encoding: "utf8",
});
console.log(output);

const tarballPattern = /\u2713\s+(\S+)\s+\u2192\s+(\S+\.tgz)/g;
const packages = [...output.matchAll(tarballPattern)].map((match) => ({
  name: match[1],
  tarball: match[2],
}));

if (packages.length === 0) {
  throw new Error("no tarballs found in verify-scaffold.mjs output");
}

const FIELDS = [
  "name",
  "version",
  "description",
  "keywords",
  "homepage",
  "repository",
  "license",
  "bugs",
  "files",
];

for (const { name, tarball } of packages) {
  const manifestText = execSync(`tar -xzOf "${tarball}" package/package.json`, {
    encoding: "utf8",
  });
  const manifest = JSON.parse(manifestText);
  const fields = Object.fromEntries(FIELDS.map((field) => [field, manifest[field] ?? null]));
  console.log(`\n${name}`);
  console.log(JSON.stringify(fields, null, 2));

  const packageDir = join(evidenceRoot, name.replace("/", "__"));
  mkdirSync(packageDir, { recursive: true });
  try {
    const readme = execSync(`tar -xzOf "${tarball}" package/README.md`, { encoding: "utf8" });
    writeFileSync(join(packageDir, "README.md"), readme);
    console.log(`README extracted to ${join(packageDir, "README.md")}`);
  } catch {
    console.log("no README.md in the packed tarball");
  }
}
```

`node scripts/verify-scaffold.mjs --keep` packs all 8 publishable packages (its own
`pkg.name && !pkg.private` filter), one tarball per `fs.mkdtempSync(path.join(os.tmpdir(),
"vex-verify-pack-"))/<package-dir-basename>/*.tgz`, then scaffolds and builds both templates
from those tarballs — the same run doubles as step 18's template-scaffold evidence, so it is
run once here and referenced, not re-run per step.

**GitHub API dumps.** Re-run step 12's GitHub surfaces block, full output captured into
`l-prepass.md`'s GitHub section (not re-summarized — steps 14–21 read the raw dump).

**Docs build.**

```bash
pnpm --filter docs build
```

`apps/docs/astro.config.mjs`'s `starlightTypedoc` plugin sets `typeDoc.treatWarningsAsErrors:
true` — the build itself fails on any TypeDoc warning, so a green exit here already proves
zero warnings; no separate warning-count check is needed.

**Launch-kit lint re-run.** Re-run the step 7 lint commands over every slot in `launch-kit.md`;
append the new run to that file's existing lint log rather than duplicating it in
`l-prepass.md`.

#### .agent/docs/specs/2026-11-06-launch-kit-final-review/l-prepass.md

````markdown
# L pre-pass evidence — VexCMS 0.1.0 launch

> Mechanical evidence only, attached next to each `surface-review.md` row so the read-through
> in steps 14–21 is judgement, not grep. No pass/fail judgement below except where the check is
> itself mechanical (e.g. "banned term found"). After any step 22 blocker fix, append a new,
> dated run under the same section — never overwrite the prior run.

## Reviewed SHA

<the SHA recorded in `surface-review.md`'s Review record>

## Matrix-row sweeps

### version / dist-tag
Command:
```
<the version/dist-tag command>
```
Output:
```
<paste>
```

### install commands (pnpm create vexcms / npm create vexcms / @alpha)
Command:
```
<the install-commands sweep>
```
Output:
```
<paste>
```

### licence line
Command / output: <paste>

### paid line (verbatim)
Command / output: <paste>

### banned paid terms
Command / output: <paste>

### support channel ("Discussions" / "discord")
Command / output: <paste>

### contact addresses
Command / output: <paste>

### funding links
Command / output: <paste>

### roadmap order
Command / output: <paste>

### field-type count claims
Command / output: <paste>

### ABAC vs RBAC wording
Command / output: <paste>

### telemetry wording
Command / output: <paste>

### accessibility claim
Command / output: <paste>

### triage window ("within a week")
Command / output: <paste>

### repo URL
Command / output: <paste>

### follow link and who builds this
Command / output: <paste>

### product one-liner and requirements
Command / output: <paste>

## Link check

Command: `node /tmp/l-link-check.mjs`
Output (full table, or artifact path `/tmp/l-link-check-report.json`):
```
<paste>
```

Negative test (AP-013): `node /tmp/l-link-check.mjs --negative-test` — the injected URL
`https://vexcms.dev/__l-link-check-negative-test__` is listed with status `404`. Confirmed,
then the flag is dropped from the real run above.

## Packed manifests and READMEs

Command: `node /tmp/l-pack-fields.mjs`
Output (per package: name, version, description, keywords, homepage, repository, license,
bugs, files; READMEs extracted under `/tmp/l-pack-evidence/<name>/README.md`):
```
<paste>
```

## GitHub API dumps

Commands: step 12's GitHub surfaces block, re-run here.
Output:
```
<paste>
```

## verify-scaffold.mjs --keep (full run)

Command: `node scripts/verify-scaffold.mjs --keep`
Output:
```
<paste>
```
(Doubles as step 18's template-scaffold evidence.)

## Docs build

Command: `pnpm --filter docs build`
Output:
```
<paste>
```

## Launch-kit lint re-run

See `launch-kit.md`'s lint log (step 7) for the appended run; linked here: <link/anchor>.
````

Verify: `rg -c "^### " .agent/docs/specs/2026-11-06-launch-kit-final-review/l-prepass.md` prints at least 14 (one per matrix row) plus the five named checks. `node /tmp/l-link-check.mjs --negative-test | rg "404 https://vexcms\.dev/__l-link-check-negative-test__"` prints a match. `pnpm --filter docs build` exits 0.

### Step 14 — L: docs and API reference [dev]

Why: the docs are where a stranger checks whether a claim is real.

- [ ] Work through `surface-review.md`'s Docs section, file by file, plus `roadmap.md`, `compare.mdx`, `accessibility.md`, TypeDoc `api/**` and `llms.txt`'s dedicated checklists
- [ ] Mark every row pass or link an `l-findings.md` id

The checklist content — including the concrete question for every file type — lives in
`surface-review.md`'s Docs section (step 12); this step is the read itself, grounded in
`l-prepass.md`'s evidence (link check, ABAC/RBAC sweep, docs-build output) rather than a fresh
grep. Open `apps/docs/dist/**/*.html` or the `vex-docs` preview — not the source `.mdx`, since
Starlight transforms admonitions, code tabs and the autogenerated sidebar order.

Verify: every docs row in `surface-review.md` is marked pass or links a finding.

### Step 15 — L: READMEs and npm manifests [dev]

Why: the README and npm pages are the first thing the npm and GitHub crowd reads.

- [ ] Work through `surface-review.md`'s READMEs and npm manifests section
- [ ] Mark every row pass or link an `l-findings.md` id

Read the packed README from `/tmp/l-pack-evidence/<name>/README.md` (`l-prepass.md`'s packed-
manifest evidence), not `packages/<name>/README.md` directly — a relative link or image that
resolves in the source tree can still break once npm renders the packed copy with no repo base
path.

Verify: every README/npm row is marked pass or links a finding.

### Step 16 — L: www and launch content [dev]

Why: vexcms.dev is the Show HN link.

- [ ] Work through `surface-review.md`'s www and launch content section at 390 px and 1280 px, light and dark
- [ ] Open the announcement, each feature post and the recap page through live preview (they are drafts)
- [ ] Mark every row pass or link an `l-findings.md` id

Verify: every www row is marked pass or links a finding, at 390 px and 1280 px, light and dark.

### Step 17 — L: live demo [dev]

Why: the first thing an HN reader clicks.

- [ ] Work through `surface-review.md`'s Live demo section on the production `vexcms.dev/admin`, as an anonymous visitor, desktop and phone
- [ ] Mark every row pass or link an `l-findings.md` id

Verify: every demo row is marked pass or links a finding, on desktop and phone.

### Step 18 — L: templates as a stranger sees them [dev]

Why: `create-vexcms` output is the product people keep.

- [ ] Read launch-infrastructure's `n-runthrough.md` before starting; reuse its Convex projects for both templates
- [ ] Work through `surface-review.md`'s Templates section for both templates. The expected `marketing-site` contents come from cross-spec decision 6: the `launch-week` page and every post document (Design Decision 23), plus the other vexcms-specific pages, routes and footer links, are absent
- [ ] Mark every row pass or link an `l-findings.md` id

Verify: every template row is marked pass or links a finding, for both templates.

### Step 19 — L: GitHub and external profiles [dev]

Why: repo settings are live now, and files on `dev` go live at the Release merge.

- [ ] Work through `surface-review.md`'s GitHub and external profiles section
- [ ] Mark every row pass or link an `l-findings.md` id

Verify: every GitHub/external row is marked pass or links a finding.

### Step 20 — L: launch kit and release notes against their surfaces [dev]

Why: every post links somewhere; each claim must match the page it points to.

- [ ] Work through `surface-review.md`'s Launch kit and release notes section
- [ ] Mark every row pass or link an `l-findings.md` id

Verify: every kit/release-notes row is marked pass or links a finding.

### Step 21 — L: consistency matrix and the copy-flip patch [dev]

Why: contradictions between surfaces are launch blockers.

- [ ] Fill `surface-review.md`'s Consistency matrix from your read plus `l-prepass.md`'s evidence
- [ ] Read `copy-flip.patch` line by line against `surface-review.md`'s Copy-flip patch review checklist
- [ ] Mark `copy-flip.patch` reviewed

Verify: every matrix cell is filled (match / finding / n/a); `copy-flip.patch` is marked reviewed.

### Step 22 — L: findings and sign-off [dev]

Why: blockers are fixed before Release; everything else is recorded, not lost.

- [ ] `l-findings.md`: one row per finding from steps 14–21
- [ ] Fix every `blocker`; re-check the touched surface and every matrix row it feeds
- [ ] Regenerate `copy-flip.patch` if a fix touched a file it covers; re-read it line by line
- [ ] Advance the reviewed SHA; sign off in `surface-review.md`

#### .agent/docs/specs/2026-11-06-launch-kit-final-review/l-findings.md

```markdown
# L findings — VexCMS 0.1.0 launch

> One row per finding from steps 14–21. `blocker` = a cross-surface contradiction, a false or
> unsupported claim, a broken link or route on a launch path, a paid tier/price/customer named
> anywhere, or alpha wording outside `copy-flip.patch`'s scope. Everything else is `backlog`.
> No open `blocker` survives this file at sign-off.

| id | surface | severity | evidence | fix commit | re-check | backlog entry |
|---|---|---|---|---|---|---|
| L-001 |  | blocker / backlog |  |  |  |  |

## Fix loop

For each `blocker`:

1. Fix it.
2. Re-check the surface it was found on, and every `surface-review.md` consistency-matrix row
   it feeds — not only the one row that caught it.
3. If the fix touched a file `copy-flip.patch` covers, regenerate the patch and re-run step
   21's line-by-line read on the new patch.
4. Advance the reviewed SHA in `surface-review.md`'s Review record to the fix commit.
5. Re-run step 12's refresh commands and step 13's evidence commands for the touched surfaces
   only, not the full pre-pass; append the new output to `l-prepass.md` under the existing
   section for that surface, dated.
6. Mark the `re-check` column `pass` with the new commit SHA.

For each `backlog` row, step 23 adds one `backlog.md` entry carrying this row's `id`; record the
entry's heading in the `backlog entry` column.
```

#### .agent/docs/specs/2026-11-06-launch-kit-final-review/surface-review.md

One edit: fill the placeholders left under the `## Sign-off` heading (step 12).

```markdown
## Sign-off

- Reviewed SHA: <final reviewed/fix commit SHA>
- Signed off by: <developer name>
- Date: <date>
- Every matrix cell above reads `match` or `n/a`; every row in every section above is `pass` or links an `l-findings.md` finding; `l-findings.md` carries no open `blocker`.
```

Verify: `rg '\| blocker \|' .agent/docs/specs/2026-11-06-launch-kit-final-review/l-findings.md | rg -v 'pass [0-9a-f]{7}'` prints nothing (every blocker carries a passing re-check with its commit). `rg -n "Reviewed SHA:" .agent/docs/specs/2026-11-06-launch-kit-final-review/surface-review.md | tail -1` shows the final commit SHA, not blank.

### Step 23 — Launch plan and backlog updates [agent]

Cross-spec decision 8: this step edits `.agent/docs/product/v0.1.0-launch-plan.md` and `.agent/docs/product/backlog.md` directly. No proposal file. Handoffs to sibling specs were applied through the 2026-11-07 cross-spec review, so only the Release item stays open here.

- [ ] Launch plan § Release mechanics: the npm `latest` dist-tag task (edit 1). It goes in by this step at the latest. Write it as soon as anyone works on Release mechanics; if it's already there, confirm the wording and move on
- [ ] Launch plan: item 17, the § U tasks and the § L tasks ticked with evidence (edits 2–4)
- [ ] `backlog.md`: the deferred channels and extras, plus one entry per `backlog` row in `l-findings.md`

#### .agent/docs/product/v0.1.0-launch-plan.md

4 edits. Everything not shown is unchanged.

**1 — § Release mechanics, the task list**, a new task directly after `- [ ] \`changeset pre exit\``:

```markdown
- [ ] Publish 0.1.0 to npm `latest`: drop `--tag alpha` from the root `release` script and `publishConfig.tag` from the 8 published packages (or `npm dist-tag add <pkg>@0.1.0 latest` per package). Until then `create-vexcms`'s `latest` stays `0.0.20`, and the post-flip `pnpm create vexcms` installs the old scaffolder. The launch-morning checklist in `2026-11-06-launch-kit-final-review/launch-kit.md` stops the launch if `latest` isn't `0.1.0`
```

**2 — Task order item 17**, `[ ]` → `[x]`, with the annotation appended:

```markdown
(`2026-11-06-launch-kit-final-review` steps 1–22; reviewed SHA <sha>)
```

**3 — § U tasks.** Tick "Write spec", "Developer-feature highlight series", "Extras the spec weighs", "Implement", "Prepared answers", "Submission list", "Launch schedule" and "Post-launch routine". In the Implement line, replace `.agent/docs/product/launch-kit.md` with `.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md`. Append to the format task:

```markdown
5-day launch week Mon–Fri, Release T-1; channels Show HN, Product Hunt, LinkedIn, Convex Discord, dev.to + Hashnode, DevHunt; Reddit/X/Bluesky/Lobsters deferred (see backlog)
```

**4 — § L tasks.** Tick "Write spec", "Implement" and its sub-items, and "Consistency matrix", each annotated with `surface-review.md` and the reviewed SHA.

#### .agent/docs/product/backlog.md

One new entry per row, in `backlog.md`'s entry format (**What / Why / Lift / Why deferred / Detail**):

| Entry | Detail source |
|---|---|
| Reddit launch posts once an account has history | `sources.md` §3.4 (per-sub rules, Showoff Saturday, weekly threads) |
| X / Bluesky presence | `sources.md` §5.16, §5.18 |
| Lobsters `show` submission once an invited account is 70+ days old | `sources.md` §1.5 |
| AlternativeTo listing (priority review or free queue) | `sources.md` §2.11–2.12 |
| Convex Templates gallery / Stack outreach | `sources.md` §5.11–5.12 |
| "Coming from Payload" docs guide | launch plan § U extras |
| Scaffold-to-deployed live-build video | launch plan § U extras |
| <one entry per `backlog` row in `l-findings.md`> | `l-findings.md` <id> |

Verify: `rg -n "Publish 0\.1\.0 to npm" .agent/docs/product/v0.1.0-launch-plan.md` prints one line, inside § Release mechanics. `rg -n '^17\. \[x\] \*\*Launch kit' .agent/docs/product/v0.1.0-launch-plan.md` prints one line. Every `l-findings.md` row with severity `backlog` has a non-empty `backlog entry` cell, and that heading exists in `backlog.md`. `harness doctor` reports no errors.

## Verification

- `pnpm typecheck && pnpm test && pnpm lint` green after step 9 (the only code step), plus `pnpm --filter www build`.
- Step 7's lint and step 9's verbatim check each pass, and each was proven to fail on a seeded defect (AP-013).
- Step 13's link check reports a deliberately broken URL, and is then clean apart from the documented not-yet-live URLs.
- `surface-review.md` carries the reviewed SHA and the developer's sign-off, and `l-findings.md` has no open `blocker`.
- `harness doctor` reports no errors.
