---
status: draft
spec_id: 2026-11-06-public-presence
touches:
  - .github/labels.yml
  - .github/ISSUE_TEMPLATE/**
  - .github/PULL_REQUEST_TEMPLATE.md
  - .github/FUNDING.yml
  - .github/assets/social-preview.png
  - scripts/sync-labels.mjs
  - package.json
  - pnpm-lock.yaml
  - CONTRIBUTING.md
  - CODE_OF_CONDUCT.md
  - SECURITY.md
  - README.md
  - .gitignore
  - apps/docs/astro.config.mjs
  - apps/docs/src/content/docs/roadmap.md
  - apps/docs/src/content/docs/compare.mdx
  - apps/docs/src/content/docs/guides/quickstart.mdx
  - apps/www/package.json
  - apps/www/convex/seed.ts
  - apps/www/convex/posts.ts
  - apps/www/public/brand/**
  - apps/www/public/tour/**
  - apps/test/public/tour/**
  - apps/www/src/vex.config.ts
  - apps/www/src/auth/access.ts
  - apps/www/src/db/constants/index.ts
  - apps/www/src/vexcms/collections/posts.ts
  - apps/www/src/vexcms/collections/index.ts
  - apps/www/src/vexcms/blocks/*/config.ts
  - apps/www/src/lib/useSitePreviewMode.ts
  - apps/www/src/lib/metadata.ts
  - apps/www/src/app/sitemap.ts
  - apps/www/src/app/(frontend)/(site)/**
  - apps/www/e2e/routes.ts
  - apps/test/convex/seed.ts
  - apps/test/src/vexcms/blocks/*/config.ts
  - .agent/docs/specs/2026-11-06-public-presence/**
  - .agent/docs/product/v0.1.0-launch-plan.md
  - .agent/docs/product/backlog.md
  - .agent/docs/standards/preferences.md
prompt_version: 1
---

# 2026-11-06-public-presence — Tasks

> Launch-plan item 16, **public presence**: Q (public post-0.1.0 roadmap), R (funding and sustainability), O (GitHub repo readiness) and T (launch content). `dev-spec` interview held 2026-11-06.
> High-care: the developer implements, and `spec.md` gives guided stubs.
> Every step that changes code leaves `pnpm typecheck && pnpm test && pnpm lint` green, plus `pnpm --filter docs build` when docs change.
>
> **Single wording source:** `public-copy.md` (step 1). R, O, T, the sibling launch specs, and later U and L reuse its strings verbatim, including the footer order (§ Footer) and the legal-page lines (§ Privacy contact, § Release emails privacy entry). Nothing public names a paid tier, a paid feature, a price or a customer.
> **Binding cross-spec decisions:** `.agent/docs/product/launch-cross-spec-decisions.md` (2026-11-07). Where this spec disagrees with it, the spec is what changed.
> **Order:** run steps 1–2 early. They gate launch-infra step 13 (`/privacy`) and quality-pass step 11 (`/accessibility`), which quote `public-copy.md` and need a live `hello@vexcms.dev`. O (steps 3–7) touches nothing but `.github/`, root community files, `scripts/sync-labels.mjs` and GitHub settings, so it can start right away. R and T steps that change `apps/www` add pages and links through `apps/www/convex/seed.ts`. Steps 10, 13 and 14 land before launch-infra's N sync (steps 17–20). The quality pass absorbed this spec's www handoff on 2026-11-07 (see "Handoff to quality pass" in `spec.md`).
> **Blocked steps:** 16 (demo media) waits for quality-pass steps 6–7. 17 (README quick start) waits for launch-infra step 19 (N's run-through). 18 (release-day copy flip and the GitHub Release) waits for Release. Every other step can go ahead.
> **Default branch:** GitHub reads issue forms, `FUNDING.yml`, the PR template and community files from `master` only. Files committed on `dev` go live at the Release merge (decision). Settings such as labels, Discussions and private vulnerability reporting apply as soon as they are set.
> **Re-seeding:** `seed:reinit` (patch mode) everywhere. Step 10 amends P-021 to say so.
> **Sources:** `sources.md` (GitHub docs, third-party widgets, `payloadcms/payload` setup, badges) and `competitors.md` (Payload, Sanity, Strapi). Every row carries its URL and the fetch date (2026-11-06).
> **Out of scope:** paid tiers and their design, the inline newsletter form, transferring the repo to the `vexcms` org, U's launch kit, L's review, `apps/docs` beyond the roadmap, comparison page and header links, the unstaged telemetry work, and edits to other specs. The `create-vexcms` marketing template takes nothing vexcms-specific from this spec: no `posts`, no `/brand`, no post documents, none of the Brand / Discussions / Release emails / Sponsor / Buy Me a Coffee footer links or the Sponsors `socialLinks` entry, and no `public-copy.md` roadmap or FAQ strings (cross-spec decision 6).

## Step 1 — Public commitments copy [agent]
Why: Q's output is the wording every later step reuses verbatim. One file makes the copy diffable and gives L's consistency matrix its source.
Verify: `public-copy.md` holds every string named in spec.md step 1. `rg -o "Paid add-ons may come later.*?nothing free becomes paid\." public-copy.md | sort -u | wc -l` prints `1`. `rg -ni "pro tier|agency|enterprise|maprios|\bSSO\b|audit log|co-edit|annual licen" public-copy.md` returns nothing. § Footer lists 16 `links` and 2 `socialLinks`, with no duplicate label or href. § Privacy contact and § Release emails privacy entry each hold exactly one line
- [ ] `public-copy.md`: the paid-work line, the post-0.1.0 roadmap (three phases, free-feature list, one line per item), the "who builds this" copy with the one-week triage line, the funding framing, the support-channel line, the contact addresses, the follow line, the Sponsors tier and goal copy, and the SECURITY response window
- [ ] `public-copy.md` § Footer: the canonical ordered `links` and `socialLinks` for www, which every seed edit inserts at (cross-spec decision 4)
- [ ] `public-copy.md` § Privacy contact and § Release emails privacy entry, quoted by `/privacy` and `/accessibility` (cross-spec decision 5)
- [ ] A table in `public-copy.md` tracking each `planned` issue number, filled in by step 7

## Step 2 — Accounts, addresses and the `vexcms` org [dev]
Why: Sponsors approval takes "a few days" (GitHub docs), and later steps need real usernames and inboxes (SECURITY.md, the CoC contact, FUNDING.yml, footer links). Applying first hides that lead time behind the rest of the work.
Verify: the Sponsors application shows "pending review" or "approved"; a test mail to `hello@vexcms.dev` and one to `security@vexcms.dev` both arrive; `gh api orgs/vexcms --jq .login` prints `vexcms`; the Buy Me a Coffee and Buttondown usernames are recorded in `public-copy.md`
- [ ] GitHub Sponsors for the personal account `ianyimi`: profile, bank/tax/2FA, tiers $3 / $10 / $50 / $250 monthly with one-time and custom amounts enabled, tier text from `public-copy.md`. Request approval. The goal is set in step 8
- [ ] Buy Me a Coffee account (plain link only, no widget)
- [ ] Buttondown account (free plan). Hosted subscribe page live at `https://buttondown.com/<user>`
- [ ] `hello@vexcms.dev` and `security@vexcms.dev` forwarding to the developer's inbox (DNS-level forwarding at the vexcms.dev DNS host)
- [ ] Claim the `vexcms` GitHub organisation (free). The repo stays at `ianyimi/vex`, and the transfer goes to the backlog (step 19)

## Step 3 — Label taxonomy and sync script [agent]
Why: a reviewable, reproducible label set rather than click-ops. The check mode catches the silent failure GitHub documents: an issue-form label that doesn't exist in the repo is skipped without error.
Verify: `node scripts/sync-labels.mjs --check` exits 1 against today's repo (default labels, prefixed set missing) and exits 0 after `node scripts/sync-labels.mjs --prune`. `gh label list --repo ianyimi/vex --limit 100 --json name --jq 'length'` equals the entry count in `labels.yml`. Adding a bogus `labels: ["nope"]` to a form makes `--check` exit 1; revert it afterwards
- [ ] `yaml` (`catalog:`) added to the root `devDependencies`. The catalog already pins `yaml` for `create-vexcms`
- [ ] `.github/labels.yml`: `status:`, `area:`, `adapter:`, `type:` (bug / feature / docs), contributor routing, resolution, prioritisation, each with a description and color
- [ ] `scripts/sync-labels.mjs`: `--check` (diff repo vs file, plus form labels vs file, exit 1 on drift), default upsert via `gh label create --force`, and `--prune` (deletes labels not in the file)
- [ ] `[dev]` Run `node scripts/sync-labels.mjs --prune` once

## Step 4 — Issue forms, template chooser and PR template [agent]
Why: blank issues and missing versions are what make triage expensive. Questions and ideas go to Discussions (decision), so issues stay actionable.
Verify: `node scripts/sync-labels.mjs --check` exits 0, which proves every form label exists. `node -e` parsing each form with `yaml` succeeds. After the Release merge, the "New issue" page on `master` shows exactly the two forms plus three contact links, and `blank_issues_enabled: false` hides the blank option from non-maintainers
- [ ] `.github/ISSUE_TEMPLATE/1-bug_report.yml`: versions of `@vexcms/*`, `convex` and `next`; adapters in use (multi-select dropdown, informational, never turned into labels); reproduction link (optional) and numbered steps (required); expected vs actual; logs (`render: shell`). Labels `type: bug` and `status: needs-triage`
- [ ] `.github/ISSUE_TEMPLATE/2-docs_issue.yml`: page URL, what's wrong, suggested fix. Labels `type: docs`, `area: docs` and `status: needs-triage`
- [ ] `.github/ISSUE_TEMPLATE/config.yml`: `blank_issues_enabled: false`. Contact links go to Discussions Q&A, Discussions Ideas and the security advisory form
- [ ] `.github/PULL_REQUEST_TEMPLATE.md`: linked issue, changeset added (`pnpm changeset`, patch per P-025), tests, docs

## Step 5 — CONTRIBUTING, CODE_OF_CONDUCT, SECURITY [dev]
Why: three of the five community-profile checks, and the launch-day signal that the project is maintained. SECURITY.md is useless without a working private channel.
Verify: `pnpm exec prettier --check CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md`. Every command named in CONTRIBUTING's dev setup was run on a fresh clone. Every address and URL in the three files resolves
- [ ] `CONTRIBUTING.md`: dev setup, the repo map, changesets, where questions, ideas, bugs and security reports go, what each `status:` label means, the reproduction bar (link or steps), the PR checklist, and the triage-within-a-week line from `public-copy.md`
- [ ] `CODE_OF_CONDUCT.md`: Contributor Covenant 3.0 verbatim (CC BY-SA 4.0 attribution kept), enforcement contact `hello@vexcms.dev`
- [ ] `SECURITY.md`: supported versions (0.1.x), report via private vulnerability reporting (preferred) or `security@vexcms.dev`, the response window from `public-copy.md`, disclosure through a GitHub Security Advisory with credit

## Step 6 — Repo settings: Discussions, private vulnerability reporting, social preview [dev]
Why: Discussions is the only support channel at launch (no Discord). Private vulnerability reporting is what SECURITY.md promises. The social card is what every shared link shows.
Verify: `gh api repos/ianyimi/vex --jq .has_discussions` prints `true`. The GraphQL `discussionCategories` query lists exactly Q&A (answerable), Ideas, Show and tell, Announcements. `gh api repos/ianyimi/vex/private-vulnerability-reporting --jq .enabled` prints `true`. Pasting the repo URL into a link unfurler (Slack/Discord/X card validator) shows the new card
- [ ] Enable Discussions (`gh api -X PATCH repos/ianyimi/vex -F has_discussions=true`). Delete General and Polls; keep Q&A, Ideas, Show and tell, Announcements. Categories are UI-only (no API mutation exists). Pin a welcome post in Announcements with the support-channel line
- [ ] `gh api -X PUT repos/ianyimi/vex/private-vulnerability-reporting`
- [ ] `.github/assets/social-preview.png`: 1280×640, < 1 MB, wordmark card per `2026-08-30-wp4-docs-repo-polish/github-page.md`, uploaded in Settings → Social preview
- [ ] Settings → General → Features: Wiki off (unused; Discussions and the docs replace it)

## Step 7 — Starter issues [agent drafts, dev files]
Why: launch visitors who want to help need scoped work, and every post-0.1.0 roadmap item needs a 👍-countable `planned` issue that the docs roadmap links to.
Verify: `gh issue list --repo ianyimi/vex --label planned --json number --jq length` prints `8`; `--label "good first issue"` returns ≥ 5; every number is recorded in `public-copy.md`; `node scripts/sync-labels.mjs --check` exits 0
- [ ] `[agent]` `issues/`: 8 `planned` drafts (plugin system, localization, scheduled publishing, TanStack Start adapter, form builder, outbound webhooks, API keys + team management, brownfield adoption). Free-tier scope only, with acceptance criteria and labels
- [ ] `[agent]` `issues/`: ≥ 5 `good first issue` drafts (+ any `help wanted`) from `backlog.md` and the task inbox. Each is scoped and has acceptance criteria
- [ ] `[dev]` File each one with `gh issue create --body-file`, then record the numbers in `public-copy.md`

## Step 8 — FUNDING.yml and the Sponsors profile [dev]
Why: renders the repo's Sponsor button (on `master`) and finishes the profile once GitHub approves it.
Verify: on the Sponsors dashboard the goal and all 4 tiers are published; `node -e "require('yaml').parse(require('fs').readFileSync('.github/FUNDING.yml','utf8'))"` parses; after the Release merge the repo header shows "Sponsor" with GitHub Sponsors and Buy Me a Coffee
- [ ] `.github/FUNDING.yml`: `github: ianyimi` and `buy_me_a_coffee: <user>`
- [ ] Sponsors profile: bio from `public-copy.md`, featured work = `ianyimi/vex`, and a monthly-amount goal using the goal copy (you set the amount at this step), with public visibility opted in

## Step 9 — Docs roadmap rewrite [dev]
Why: `apps/docs/src/content/docs/roadmap.md` is the single source of the public roadmap. Its "In progress" list goes stale the day 0.1.0 tags, and its "Enterprise" section names paid features.
Verify: `pnpm --filter docs build`. `rg -n "Enterprise|annual licence|co-editing|SSO|audit log|In progress|alpha" apps/docs/src/content/docs/roadmap.md` returns nothing. Each of the 8 post-0.1.0 items links its `planned` issue and the link resolves. The paid line matches `public-copy.md` byte for byte
- [ ] Sections: intro, Shipped in 0.1.0, After 0.1.0 (1 plugin system → 2 free features, unordered and demand-driven → 3 brownfield adoption), Not planned, then the paid line
- [ ] `apps/docs/astro.config.mjs`: the `starlightLlmsTxt` `details` roadmap sentence matches the new page (the alpha wording flips in step 18)

## Step 10 — www and apps/test seed copy: roadmap page, FAQ, footer [dev]
Why: the www roadmap block and FAQ summarise Q and must not name paid work. "Who builds this" and the funding and follow links are R's public surface. Footer links are seed data (P-018), so this needs no code.
Verify: `pnpm --filter www typecheck && pnpm --filter www test`. `rg -n "Enterprise Add-Ons|annual licence|co-editing|Multi-Component" apps/www/convex/seed.ts apps/test/convex/seed.ts apps/www/src/vexcms/blocks` returns nothing. `pnpm --filter www exec convex run seed:reinit` on the dev deployment; `/roadmap` and `/` render the new copy on the running www (port 3030, P-024), and the footer entries present so far appear in `public-copy.md` § Footer order
- [ ] `apps/www/convex/seed.ts`: roadmap page hero, stats and items (shipped list corrected, post-0.1.0 items as `planned` in phase order, paid and dropped items removed); FAQ "What does it cost?" ends with the paid line; new "Who builds VexCMS?" item; FAQ `supportLink` → Discussions; footer `links` gain Discussions, Release emails, Sponsor and Buy Me a Coffee, and `socialLinks` gains GitHub Sponsors, each at its § Footer position
- [ ] `apps/www/src/vexcms/blocks/Roadmap/config.ts` and `FAQ/config.ts` `defaultValue`s aligned to `public-copy.md` (these ship to admins adding a new block)
- [ ] `apps/test/convex/seed.ts` and the matching `apps/test` block `defaultValue`s: the same copy changes (`apps/test` stays a superset of www). Run this only after the telemetry work in `apps/test` is committed
- [ ] `.agent/docs/standards/preferences.md` P-021: name `seed:reinit` (patch mode) as the way a content change ships, replacing "wipe rows, then `seed:init`" (cross-spec decision 9)

## Step 11 — Docs header links and the slim README [dev]
Why: R's links on the docs, and T's landing README. The 300-line feature reference duplicates the docs and goes stale. The README becomes the pitch plus links.
Verify: `pnpm --filter docs build`; the docs header shows GitHub, Sponsor and Release emails icons with accessible labels. The README renders on GitHub (preview the branch) with all 4 badges resolving. `rg -n "co-editing|SSO|audit logs|annual licence" README.md` returns nothing
- [ ] `apps/docs/astro.config.mjs` `social`: add `heart` → Sponsors and `email` → Buttondown
- [ ] `README.md` rewritten: badges (npm version, CI, licence, Sponsors), hero (the existing `preview.png` until step 16), pitch, quick start (current flow condensed + docs link until step 17), Why Vex, Docs, Roadmap summary + link, Community (Discussions, issues, CONTRIBUTING, SECURITY), Who builds this, Sponsors (names $50, name + logo $250, empty-state line), License + paid line

## Step 12 — Comparison page [dev]
Why: answers the launch's most common question ("why not Payload/Sanity/Strapi?") with one fair, dated link.
Verify: `pnpm --filter docs build`; the page renders in the sidebar after Roadmap. Every competitor cell links its source. Each competitor column shows its check date, and every date is within 7 days of the day the page ships (re-check against `competitors.md` and update the dates). `rg -n "SSO|audit|co-edit" apps/docs/src/content/docs/compare.mdx` returns nothing
- [ ] `apps/docs/src/content/docs/compare.mdx`: intro, a free-tier capability table (Vex + 3 competitors, one check date per competitor), "When to pick something else", sources
- [ ] `apps/docs/astro.config.mjs` sidebar: a `compare` entry after Roadmap

## Step 13 — Brand kit: logos, `/brand` page, footer link [dev]
Why: U's posts, Product Hunt and the social card need fixed logo files at stable public URLs. The media kit lives on www (decision) as a seeded page, because Next serves no index for a public folder.
Verify: `pnpm --filter www typecheck && pnpm --filter www test`; after `seed:reinit`, `/brand` renders, and every link on it returns 200 (`curl -sI http://localhost:3030/brand/<file>`). The footer shows "Brand" at its § Footer position
- [ ] `apps/www/public/brand/`: `vexcms-logo-light.svg`, `vexcms-logo-dark.svg`, `vexcms-mark.svg`, 1024 px PNG exports of each, and `vexcms-mark-240.png` (240×240, the Product Hunt logo)
- [ ] `apps/www/convex/seed.ts`: a `brand` page (Hero compact + CTA actions linking each file) and the footer "Brand" link at its § Footer position. Same edit in `apps/test/convex/seed.ts` (after the telemetry commit)
- [ ] `apps/www/e2e/routes.ts`: `{ path: "/brand" }` in `QUALITY_ROUTES`, if the file exists

## Step 14 — www posts and the announcement post [dev]
Why: T's announcement needs a canonical URL that every cross-post in U points at, and U's feature series needs more posts after it. The `posts` collection and `/posts/[slug]` route already exist in `apps/test`. www mirrors them (decision) and dogfoods the richtext field.
Verify: `pnpm --filter www exec vex generate && pnpm --filter www typecheck && pnpm --filter www test && pnpm --filter www build`. After `seed:reinit`, the seeded announcement opens as a draft in the running admin, and live preview renders it at `/posts/vexcms-0-1-0`. As an anonymous visitor the URL 404s. The draft audit (spec.md step 14, cross-spec decision 3) is recorded in quality-pass `findings.md`
- [ ] `@vexcms/richtext-plate` (`workspace:*`) in `apps/www/package.json`; `editor: plateEditor()` in `apps/www/src/vex.config.ts`
- [ ] `apps/www/src/db/constants/index.ts`: `TABLE_SLUG_POSTS`; `apps/www/src/vexcms/collections/posts.ts` (title, slug, excerpt, body richtext, ogImage; drafts + autosave; live preview); export it in `collections/index.ts`
- [ ] `apps/www/src/lib/useSitePreviewMode.ts` (port of `apps/test`'s); `PageContent.tsx` imports it instead of its private copy
- [ ] `apps/www/src/auth/access.ts`: anonymous and demo roles read published posts only
- [ ] `apps/www/convex/posts.ts` (`getBySlug`, `getBySlugPreview`, `publishedSlugs`); `apps/www/src/app/(frontend)/(site)/posts/[slug]/page.tsx` + `PostContent.tsx` (mirrors `apps/test`); `generatePostMetadata` in `apps/www/src/lib/metadata.ts`; `apps/www/src/app/sitemap.ts` lists published posts
- [ ] `apps/www/convex/seed.ts`: the announcement post (`vex_status: "draft"`), with its Plate JSON body and the canonical URL from `public-copy.md`
- [ ] `apps/www/e2e/routes.ts`: `{ path: "/posts/vexcms-0-1-0", draft: true }` in `QUALITY_ROUTES`, if the file exists. The `draft` flag is removed in the D1 edit that publishes the post

## Step 15 — Private planning docs out of the public repo [dev]
Why: Q keeps tiers, pricing, licence enforcement and customer specifics private. All of it is public today: `.agent/` is tracked on `master` and `dev` of a public repo (pitch deck, `post-v0.1.0-plan.md`, `product/roadmap.md`). Launch traffic is when strangers read the tree. This is a launch blocker for L.
Verify: on GitHub, `gh api "repos/ianyimi/vex/contents/.agent?ref=dev"` returns 404 once the change is pushed. `git ls-files .agent | wc -l` prints `0`, and `.agent` resolves through the `harness install` link. `harness doctor` is clean. Whether history is rewritten is recorded as an explicit decision
- [ ] `[agent]` `private-inventory.md`: every tracked file holding tiers, prices, licence enforcement, ENT-P or customer specifics, with the matching line counts (this spec folder included). It's the evidence for the history-rewrite decision; the move itself takes all of `.agent/`
- [ ] `[dev]` Move the whole `.agent/` to the central `../agents` link with `harness install` (option A, cross-spec decision 10), as soon as no session has unstaged `.agent/` edits. Every `.agent/docs/specs/…` path keeps resolving through the link
- [ ] `[dev]` Decide on history rewriting (destructive: `git filter-repo` + force-push, and clones and forks keep the old history). Record the decision either way

## Step 16 — Demo media: hero GIF, screenshots, demo video [dev] [blocked: quality-pass steps 6–7 (admin and www visual fixes)]
Why: recorded media freezes the UI. Recording before the quality pass's admin and www fixes would ship pre-fix screens to the README, `/brand`, `/tour` and U's posts. One shared session covers this step, launch-kit step 8's clips and launch-infra's `/tour` recapture (cross-spec decision 7).
Verify: the GIF is ≤ 10 MB and loops on GitHub; the MP4 is H.264, 30–60 s, ≤ 10 MB if it's also attached on GitHub; every new `/brand` link returns 200; the README hero renders on the branch preview; the 4 `/tour` screenshots are byte-identical in `apps/www/public/tour/` and `apps/test/public/tour/`; launch-kit step 8's verify passes for its 4 clips
- [ ] Record one take of building a site with the packages (scaffold → collection → admin edit → live preview → publish). Export a 30–60 s MP4 and a cut-down looping GIF
- [ ] Screenshots at fixed sizes (1280×800 admin, 1280×800 live preview, 390×844 mobile admin, 1270×760 Product Hunt gallery)
- [ ] Same session: launch-kit step 8's 4 feature clips into `apps/www/public/launch/`
- [ ] Same session: recapture launch-infra step 10's 4 `/tour` screenshots (1280×800: dashboard, list view with a saved view, edit view with live preview, media library), same file names, into `apps/www/public/tour/` and `apps/test/public/tour/`
- [ ] `apps/www/public/brand/`: add the MP4, screenshots and a `vexcms-media-kit.zip`; extend the `/brand` CTA actions in both seeds
- [ ] `README.md` hero: the looping GIF linking to the MP4 on `/brand`

## Step 17 — README quick start [dev] [blocked: launch-infra step 19 (N's template run-through)]
Why: the quick start must be the command list that N's manual run-through proved on a fresh Convex deployment, not today's 7-command flow.
Verify: the three commands, run verbatim in an empty directory against a fresh Convex deployment, end at a signed-in admin
- [ ] `README.md` quick start: the three commands from N's run-through and a link to the docs quickstart for the manual setup

## Step 18 — 0.1.0 release notes and release-day copy flip [dev] [blocked: Release (everything else shipped)]
Why: release notes describe what actually shipped. The alpha wording changes on the day `0.1.0` is on npm, through launch-kit's `copy-flip.patch`, which L reviews (launch-kit steps 11 and 21) and Release applies unchanged (cross-spec decision 2). Nothing changes after L except the Release version bumps and that patch.
Verify: `gh release view v0.1.0 --repo ianyimi/vex --json isLatest --jq .isLatest` prints `true`. `gh api repos/ianyimi/vex/releases/latest --jq .tag_name` prints `v0.1.0`. Post-apply check: `rg -n "@alpha|0\.1\.0-alpha" README.md apps/docs/src/content/docs apps/docs/astro.config.mjs apps/www/convex/seed.ts apps/test/convex/seed.ts apps/www/package.json apps/www/src/vexcms/blocks apps/test/src/vexcms/blocks` returns nothing; a hit is a gap in the patch, reported back to L, not hand-fixed. The announcement is still a draft
- [ ] `[agent]` `release-notes.md` drafted from `.changeset/*.md`, the package CHANGELOGs and the docs roadmap's shipped list: highlights, breaking changes since the alphas, upgrade notes. `[dev]` edits it before L reads it
- [ ] `[dev]` Apply `.agent/docs/specs/2026-11-06-launch-kit-final-review/copy-flip.patch` unchanged (`git apply`), then `seed:reinit` on production
- [ ] `[dev]` Once changesets has published, run `gh release create v0.1.0 --target master --title "VexCMS 0.1.0" --notes-file .agent/docs/specs/2026-11-06-public-presence/release-notes.md --latest`

D1 note (not part of Release): on D1 morning the announcement is published from the admin; the same day its seed `vex_status` flips to `"published"` in both seeds (then `seed:reinit`) and its `draft` flag leaves `QUALITY_ROUTES`. From then on it is reachable anonymously. The steps live in `2026-11-06-launch-kit-final-review/launch-kit.md` § Launch-morning checklist (cross-spec decision 1).

## Step 19 — Bookkeeping [agent]
Why: plan and backlog stay the source of truth. This step edits them directly (cross-spec decision 8).
Verify: launch plan item 16 and the Q, R, O and T task lists ticked, with commit refs; each new backlog entry follows `backlog.md`'s entry format; `harness doctor` clean
- [ ] `v0.1.0-launch-plan.md`: tick item 16 and the Q, R, O and T tasks, with evidence. The Q task's paid line and free-feature list are updated to the decided wording
- [ ] `backlog.md`: the repo transfer to `vexcms`; the inline newsletter form; `createGithubReleases: false` + one release per version; a generated sponsors image. (No posts-index entry: launch-kit's `/launch-week` recap page resolved it)
