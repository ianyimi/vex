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

# 2026-11-06-public-presence — Spec

## Overview

Launch-plan item 16 makes VexCMS presentable to the strangers who arrive at launch. It covers four sections of the plan:

- **Q** publishes the post-0.1.0 roadmap: free-tier work only, plus one line on paid work.
- **R** sets up community funding: GitHub Sponsors, Buy Me a Coffee, contact addresses and "who builds this" copy.
- **O** gets the GitHub repo ready: labels, issue forms, Discussions, community files, private vulnerability reporting, starter issues.
- **T** produces the launch content: a comparison page, a slim README, a brand kit, the www announcement post, release-email signup, and the 0.1.0 release notes.

Q's interview ran first, so its wording, recorded in `public-copy.md`, is what R, O, T, the sibling launch specs, and later U and L reuse verbatim. That includes the canonical www footer order and the contact and newsletter lines that `/privacy` and `/accessibility` quote, so steps 1–2 run early. O is independent and can start right away. The www changes go through `apps/www/convex/seed.ts`, and the quality pass absorbed their audit handoff on 2026-11-07. The media capture waits for the quality pass's admin and www fixes. Release applies launch-kit's reviewed copy-flip patch, and the announcement goes live on D1.

`.agent/docs/product/launch-cross-spec-decisions.md` (2026-11-07) binds this spec and its three siblings. Decisions 27–32 below and the edits to decisions 9, 21, 22 and 25 carry it into this spec.

The interview also surfaced a launch blocker outside the plan. The public repo tracks `.agent/`, so the private pricing and tier documents are readable on GitHub today (step 15).

## Design Decisions

1. **One wording source: `public-copy.md` in this spec folder.** Q's outputs are commitments, and every surface must read the same. Why: L's consistency matrix needs one source to diff against, and copy-pasted variants drift (www's and apps/test's FAQ already disagree on what's paid).
2. **The paid-work line drops "above":** "Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid." Why: the plan's "the free roadmap above" reads wrong on the surfaces that have no roadmap above it: the README licence section, the FAQ, the Sponsors bio.
3. **Public roadmap shape: Shipped in 0.1.0 → After 0.1.0 (3 phases) → Not planned → paid line.** The In progress, Planned, Future, Exploring and Enterprise buckets go. Why: a short page you can keep; the old buckets either go stale at the tag or name paid work.
4. **Phase 2 is unordered and demand-driven.** It names localization, scheduled publishing, the TanStack Start adapter, the form builder, outbound webhooks, and API keys + team management. Why: Track FR "interleaves as demand appears", and 👍 on the linked `planned` issue is the demand signal. The page doesn't promise an order the internal plan doesn't make.
5. **Omitted from every public surface:** maprios / Track MW, multi-component workspaces, the analytics adapter, auto-migration, block-group categorization, the "React package testing suite" www item, Track DB, presence, S3/R2 adapters. The 0.1.0 non-goals get no separate list. Why: the public page carries commitments only. The non-goals that matter already read as "after 0.1.0" in phase 2.
6. **`planned` issue links appear on the docs roadmap only.** Why: the www Roadmap block item has no link field. A link there means a block schema change for one surface.
7. **GitHub Sponsors on the personal account `ianyimi`, applied for in step 2.** Why: 0% fee on sponsorships from personal accounts, and approval takes days, not the org path's invitation + W-8BEN-E (`sources.md` §1). An org profile can be added later as a separate enrollment.
8. **Tiers: $3 / $10 / $50 / $250 monthly, one-time and custom amounts on. $50 = name in the README, $250 = name + logo, lower tiers thank-you only.** The goal is a monthly amount set at step 8. Why: developer decision. The listing practice matches ESLint, Vite, Astro, Vue and tRPC READMEs. Tier prices can't be edited once published (`sources.md` §1), so the tier text is settled in `public-copy.md` before step 2.
9. **Buy Me a Coffee and the newsletter are plain links, never widgets or forms.** Why: a link needs no CSP origin and no script (`sources.md` §2). The BMC widget's script host isn't documented on any unauthenticated primary page. The newsletter still collects email addresses, so `/privacy` carries one line on it: `public-copy.md` § Release emails privacy entry, linked to Buttondown's privacy policy (cross-spec decision 5).
10. **The newsletter is Buttondown's hosted subscribe page, linked as "Release emails".** Why: launch day is the largest visitor spike, and GitHub "Watch → Releases" fires 8 times per version (one release per package). The hosted page costs no code, is free up to 100 subscribers, and its double opt-in is mandatory. The inline form goes to the backlog.
11. **Contact addresses: `hello@vexcms.dev` (sponsorship, partnership, business, Code of Conduct enforcement) and `security@vexcms.dev`.** Why: developer decision, and two inboxes are enough for one maintainer.
12. **Response time: "New issues are triaged within a week."** SECURITY.md uses the same window for acknowledging a report. Why: realistic for one maintainer working in free time. One number on every surface.
13. **Labels mirror Payload's prefixed taxonomy (`status:` / `area:` / `adapter:`), with `type:` labels instead of GitHub issue types.** Why: the plan models them on `payloadcms/payload` (`sources.md` §3), and issue types (the form `type:` key) exist only for organization-owned repos (`sources.md` §1). `type: question` is dropped because questions go to Discussions.
14. **No triage automation: forms apply static labels only.** Why: Payload's `triage.yml` turns dropdown answers into labels and has left about 20 junk labels in its repo (`- area: core`, `(Select all that apply) …`; `sources.md` §3). The plan already defers `stale.yml` and `lock-issues.yml`.
15. **Feature requests go to Discussions → Ideas; issue forms are bug + docs only.** Why: developer decision, and Payload's model. Issues stay actionable. Accepted ideas become `type: feature` issues filed by the maintainer.
16. **Reproduction bar: a link or numbered steps.** The bug form requires steps; the link is optional. Why: developer decision. A Convex-backed repro is costly for a stranger to set up.
17. **`.github/labels.yml` + `scripts/sync-labels.mjs`, with `yaml` (already in the catalog for `create-vexcms`) added as a root devDependency.** Mirrors the existing `scripts/*.mjs` checks (`check-packed-manifests.mjs`): a `--check` mode that exits non-zero on drift, proven by a negative test (AP-013). Why: GitHub documents no official label-sync action, and a form label that doesn't exist in the repo is skipped silently. The plan names `labels.yml`, and the same parser checks the issue forms.
18. **O's files go live at the Release merge.** Settings (labels, Discussions, private vulnerability reporting) apply right away. Why: developer decision. `master` is 39 commits behind `dev`, and an early cherry-pick PR would split one change across two merges.
19. **`vexcms` org: claim now, keep the repo at `ianyimi/vex` through launch.** The transfer goes to the backlog. Why: name protection is free, and the transfer touches `package.json#repository` in 9 packages. Three of those (`cli`, `create-vexcms`, `telemetry`) carry unstaged telemetry work.
20. **The comparison page covers free-tier capabilities only.** It has no SSO, audit-log or co-editing rows. Each competitor column carries its own check date. Why: a Vex "—" in those rows invites the paid question. The dates make the page honest about staleness (`competitors.md`).
21. **The announcement is a `posts` document on www, mirroring `apps/test`'s `posts` collection and `/posts/[slug]` route.** Release (T-1) ships it as a draft. It's published from the admin on D1 morning, and its seed `vex_status` flips to `"published"` the same day (cross-spec decision 1). Why: U needs one canonical URL plus room for its feature series, and the closest existing system is `apps/test`'s route (live preview, richtext). D1, not Release, because Release is the day before launch. It is www only; the marketing template excludes it (Out of Scope, cross-spec decision 6).
22. **The brand kit is `apps/www/public/brand/` plus a seeded `/brand` page built from existing blocks (Hero + CTA).** It includes a 240×240 `vexcms-mark-240.png` for the Product Hunt listing (launch-kit handoff). Why: developer decision. Next serves no index for a public folder. P-018 keeps site design as block data.
23. **The README is slimmed to a landing page.** The demo is a looping GIF (≤ 10 MB) that links to the full MP4 on `/brand`. Why: developer decision. GitHub GIFs loop; uploaded MP4s render a player that doesn't autoplay (`sources.md` §4). The feature reference already lives in the docs.
24. **The 0.1.0 release notes publish as a standalone `v0.1.0` GitHub Release marked Latest.** The per-package releases stay; stopping them goes to the backlog. Why: `releases/latest` resolves to `@vexcms/cli@0.0.20` today (alphas are prereleases), and changesets creates 8 releases per version. One `v0.1.0` page gives U's posts a link and the repo sidebar the right "Latest".
25. **Private planning documents leave the public repo before L, by moving the whole `.agent/` to the central `../agents` link with `harness install` (step 15, option A).** It runs as soon as no session has unstaged `.agent/` edits. Why: Q requires tiers, pricing and customer specifics to stay private. `.agent/docs/research/pitch-deck/04-business-model.md` (prices), `post-v0.1.0-plan.md` and `product/roadmap.md` (tiers) are tracked on `master` and `dev` of a public repo. The symlink keeps every `.agent/docs/specs/…` path valid, so no spec path changes (cross-spec decision 10). History rewriting stays a separate, explicit decision at that step.
26. **Copy edits in `apps/www/convex/seed.ts` are mirrored in `apps/test/convex/seed.ts`.** Why: `apps/test` stays a superset of www (decision 2026-11-06, quality pass). Its FAQ still names paid add-ons (it even lists localization as paid). Those edits run after the telemetry work in `apps/test` is committed.
27. **`public-copy.md` § Footer is the one canonical ordered list of www footer `links` and `socialLinks`.** Every seed edit, in this spec, launch-infra (`/privacy`) and the quality pass (`/accessibility`), inserts its entry at its listed position. Entries whose owning step hasn't landed are simply absent, and the rest keep their relative order. Why: three specs edit the same array (cross-spec decision 4).
28. **`public-copy.md` § Privacy contact (`hello@vexcms.dev`) and § Release emails privacy entry are quoted verbatim by `/privacy` and `/accessibility`.** Why: one contact line on every legal page (cross-spec decision 5). Those pages need steps 1–2 done first.
29. **Draft routes are audited locally, not in CI.** Steps 13 and 14 add `{ path: "/brand" }` and `{ path: "/posts/vexcms-0-1-0", draft: true }` to `QUALITY_ROUTES` in `apps/www/e2e/routes.ts`. The draft's audit follows cross-spec decision 3. Why: CI can't render a draft, and an unaudited route mustn't reach L.
30. **Re-seeding is `seed:reinit` (patch mode) everywhere.** Step 10 amends P-021 to name it. Why: `init` only inserts absent rows, and wiping rows to force a re-insert opens a data-loss window (cross-spec decision 9).
31. **The release-day copy flip is launch-kit's reviewed `copy-flip.patch`, applied unchanged.** Step 18 applies it and creates the `v0.1.0` GitHub Release; its own `rg` is only a post-apply check. Why: the patch's scope is every alpha string on an inventoried surface, wider than step 18's list, and L reviews it (cross-spec decision 2).
32. **One media session (step 16, launch-kit step 8, the `/tour` recapture), blocked on quality-pass steps 6–7.** It records this spec's demo video, GIF and screenshots, launch-kit's 4 clips, and launch-infra's 4 `/tour` screenshots for both apps. Why: everything recorded freezes the admin and www UI, so all of it waits for both visual-fix steps (cross-spec decision 7).

## Out of Scope

- Paid tiers, their features, pricing, licence design, ENT-0 / ENT-P: not designed, named or announced anywhere.
- The inline newsletter form (www block or docs `Footer` override): backlog.
- Transferring the repo to the `vexcms` org: backlog. Claiming the org is in scope.
- Stopping per-package GitHub Releases (`createGithubReleases: false`): backlog.
- A posts index route, RSS, tags or authors. Launch-kit's `/launch-week` recap page covers launch week.
- The `create-vexcms` marketing template takes nothing vexcms-specific from this spec: not the `posts` collection or `/posts/[slug]` (`@vexcms/richtext-plate` stays out of the marketing template), not the `brand` page or any post document, none of the Brand, Discussions, Release emails, Sponsor or Buy Me a Coffee footer links or the Sponsors `socialLinks` entry, and no `public-copy.md` roadmap or FAQ strings (the template gets generic copy). Launch-infra's N steps apply the exclusion (cross-spec decision 6).
- Triage automation (`triage.yml`, `stale.yml`, `lock-issues.yml`, `label-on-change.yml`), discussion category forms, a custom `VULNERABILITY_REPORT.yml`.
- U's launch kit, channel posts and launch schedule; L's surface review.
- `apps/docs` beyond the roadmap page, the comparison page, the header links and the `llms.txt` details string.
- Accessibility, performance and CSP work on the new www routes: owned by `2026-11-06-quality-pass` (see the handoff below, absorbed 2026-11-07).
- The unstaged telemetry work in `packages/cli`, `packages/telemetry`, `packages/create-vexcms`, `apps/test` and `scripts/`. Steps that edit `apps/test` wait for it to be committed.
- Editing other specs. The launch plan and `backlog.md` are edited directly in step 19 (cross-spec decision 8).

## Handoff to quality pass (absorbed 2026-11-07)

> **Absorbed 2026-11-07.** `2026-11-06-quality-pass/spec-tasks.md` (updated 2026-11-07) carries every item below: routes in step 1's inventory and step 2's `QUALITY_ROUTES`, the CSP note in step 8, `/posts/[slug]` and the Plate bundle in step 7, the footer order in step 11. The section stays as the record of what was handed over. The original "whichever lands second rebases" rule for the footer is replaced by `public-copy.md` § Footer (decision 27).

For `2026-11-06-quality-pass`, as handed over on 2026-11-06 with the 2026-11-07 decisions applied. This spec doesn't edit it.

**Third-party origins for the CSP (its step 8).** None are needed. Every third-party touchpoint this spec adds to www is a plain top-level navigation link, and CSP doesn't govern those (`sources.md` §2, CSP summary table):

| Touchpoint | Where | Form | CSP directive needed |
|---|---|---|---|
| GitHub Sponsors `https://github.com/sponsors/ianyimi` | footer `links` + `socialLinks` | `<a href>` | none |
| Buy Me a Coffee `https://buymeacoffee.com/<user>` | footer `links` | `<a href>` | none |
| Buttondown `https://buttondown.com/<user>` ("Release emails") | footer `links` | `<a href>` | none |
| GitHub Discussions | footer `links`, FAQ `supportLink` | `<a href>` | none |
| `/brand/*` logos, screenshots, MP4, zip | `/brand` page | same-origin files under `public/brand/` | covered by `'self'` (the MP4 falls back to `default-src 'self'` unless a stricter `media-src` is set) |
| Announcement post body images | `/posts/[slug]` | Convex storage URLs (richtext image nodes) | already in its `img-src` (Convex storage host) |

If the backlogged inline newsletter form ever lands, it needs `form-action https://buttondown.com`. The same goes for a BMC widget (`script-src`, unverified host) or a Sponsors iframe (`frame-src https://github.com`). None of these are in this spec.

**New and changed routes for its route list (`apps/www/e2e/routes.ts`) and the width matrix:**

- `/posts/vexcms-0-1-0` (step 14): a new route and the first richtext-rendered page on www. It's a draft until D1, so it carries `draft: true` in `QUALITY_ROUTES` and is audited locally per cross-spec decision 3. `apps/test`'s `posts/[slug]` (its step 12) is the same component tree, so fixes made there carry over: port the fixed version.
- `/brand` (step 13): a seeded page built from existing Hero + CTA blocks, with file download links.
- `/roadmap` and `/` (step 10): copy-only changes to existing blocks. The new FAQ item "Who builds VexCMS?" adds one accordion entry.
- Footer (steps 10, 13): new `links` entries (Discussions, Release emails, Sponsor, Buy Me a Coffee, Brand) and one `socialLinks` entry (`Heart`), each at its `public-copy.md` § Footer position. Its step 11 inserts Accessibility at its own § Footer position.
- `apps/www/src/app/(frontend)/(site)/PageContent.tsx` (step 14): its private `useSitePreviewMode` moves to `src/lib/useSitePreviewMode.ts`, as `apps/test` already has it. No behavior change, but the file is on its www surface list.
- `apps/www` gains `@vexcms/richtext-plate` (step 14). The first richtext render on www adds Plate's static renderer to the `/posts/[slug]` bundle, so check that route against its Lighthouse budgets.

**Ordering.** Steps 13 and 14 add their `QUALITY_ROUTES` entries in the same change when `apps/www/e2e/routes.ts` exists; otherwise the quality pass's `inventory.md` already lists them. Step 16 (demo media) waits for its steps 6–7.

## Implementation

### Step 1 — Public commitments copy [agent]

- [ ] `.agent/docs/specs/2026-11-06-public-presence/public-copy.md` created with the content below
- [ ] The `<buttondown-user>` and `<bmc-user>` placeholders are filled in by step 2; the `planned` issue table is filled by step 7

The file is the wording contract. Later steps, and the sibling launch specs, quote its sections by heading. A change to any string is made here first and then propagated, never edited on one surface alone. The handle `@ianyimi` stands in for the maintainer's name; swap in a display name here if you want one shown.

§ Footer is the one canonical order for the www footer (decision 27). Each entry names the step that inserts it. An entry whose step hasn't landed is absent from the seed, and the entries around it keep their relative order; nobody re-sorts the array by hand. "Privacy" sits right after "Licence", where launch-infra step 13 puts it. § Privacy contact and § Release emails privacy entry are quoted verbatim by launch-infra's `/privacy` and the quality pass's `/accessibility` (decision 28), which is why steps 1–2 run first. The Buttondown privacy policy URL was checked on 2026-11-07 (HTTP 200, title "Privacy policy").

#### .agent/docs/specs/2026-11-06-public-presence/public-copy.md

```markdown
# Public copy — VexCMS 0.1.0

> The single wording source for every public surface: docs, www (`apps/www/convex/seed.ts`),
> README, GitHub (community files, Sponsors, Discussions), npm, and U's launch kit.
> Quote these strings verbatim. Change them here first, then everywhere they appear.
> Never name a paid tier, a paid feature, a price, or a customer on a public surface.

## Paid-work line

Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid.

## Licence line

VexCMS is Apache-2.0 licensed.

## Roadmap — after 0.1.0

Intro: Everything below is free and lands in the Apache-2.0 core. It ships in this order.

1. **Plugin system** — The extension points 0.1.0 ships (admin slots, component overrides, action contributions) become a supported plugin API for collections, fields, hooks, access rules and admin views.
2. **Free features, as demand appears** — No fixed order: 👍 the linked issue to move one up.
   - **Localization** — Per-field locale values, opted into per collection and per field, with locale-aware drafts.
   - **Scheduled publishing** — Publish and unpublish at a set time, on Convex's scheduler.
   - **TanStack Start adapter** — The admin panel and the caching helpers on a second framework.
   - **Form builder** — Collect input from site visitors, with generated validation and stored submissions.
   - **Outbound webhooks** — Notify other services when content changes.
   - **API keys and team management** — Invite people, assign roles, and issue scoped keys for reading content from outside.
3. **Brownfield adoption** — Add VexCMS to an existing Convex app table by table, without migrating the data it already holds.

Not planned: `imageUrl` field — use `upload` with the media library, or a `url` field.

### `planned` issues

| Item | Issue |
|---|---|
| Plugin system | #… |
| Localization | #… |
| Scheduled publishing | #… |
| TanStack Start adapter | #… |
| Form builder | #… |
| Outbound webhooks | #… |
| API keys and team management | #… |
| Brownfield adoption | #… |

## Who builds this

VexCMS is built and maintained by one developer, [@ianyimi](https://github.com/ianyimi), in their free time. New issues are triaged within a week; how fast a fix lands depends on its severity and on sponsorship.

## Funding

Sponsorship pays for time on the free core: faster bug fixes first, then the free roadmap. Sponsor on [GitHub Sponsors](https://github.com/sponsors/ianyimi) (monthly or one-time), or [buy me a coffee](https://buymeacoffee.com/<bmc-user>).

## Support channels

Questions and ideas go to [GitHub Discussions](https://github.com/ianyimi/vex/discussions). Bugs go to [issues](https://github.com/ianyimi/vex/issues/new/choose). Security reports go to [private vulnerability reporting](https://github.com/ianyimi/vex/security/advisories/new) or security@vexcms.dev — never a public issue.

## Contact

- hello@vexcms.dev — sponsorship, partnership and business enquiries, and Code of Conduct reports.
- security@vexcms.dev — security reports, when private vulnerability reporting isn't an option.

## Follow

Release emails: one email per release, nothing else — [subscribe](https://buttondown.com/<buttondown-user>).

## Security response window

Reports are acknowledged within a week. Supported versions: the latest 0.1.x release.

## GitHub Sponsors

Bio: I build VexCMS, a type-safe headless CMS built on Convex, in my free time. Sponsorship funds the free core: faster bug fixes first, then the free roadmap. Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid.

| Tier | Monthly | Description (published text — immutable once published) |
|---|---|---|
| Supporter | $3 | Funds a little free-tier maintenance time every month. Thank you. |
| Backer | $10 | Helps keep bug-fix turnaround inside a week. |
| Sponsor | $50 | Your name in the Sponsors section of the VexCMS README. |
| Company sponsor | $250 | Your name and logo in the Sponsors section of the VexCMS README. |

Goal (monthly amount, set at step 8): When this goal is met, VexCMS gets <N> funded days a month of free-tier work: bug fixes first, then the next roadmap item.

## Footer

The canonical order of the www footer (`footers` doc `Main Footer`, block `main-footer`). Every seed edit inserts its entry at this position. Labels and hrefs are verbatim.

`links`:

| # | label | href | Inserted by |
|---|---|---|---|
| 1 | Features | `/features` | existing |
| 2 | Roadmap | `/roadmap` | existing |
| 3 | Docs | `https://docs.vexcms.dev` | existing |
| 4 | Quickstart | `https://docs.vexcms.dev/guides/quickstart/` | existing |
| 5 | Admin demo | `/admin` | existing |
| 6 | Discussions | `https://github.com/ianyimi/vex/discussions` | public-presence step 10 |
| 7 | Release emails | `https://buttondown.com/<buttondown-user>` | public-presence step 10 |
| 8 | Sponsor | `https://github.com/sponsors/ianyimi` | public-presence step 10 |
| 9 | Buy Me a Coffee | `https://buymeacoffee.com/<bmc-user>` | public-presence step 10 |
| 10 | Brand | `/brand` | public-presence step 13 |
| 11 | npm | `https://www.npmjs.com/package/@vexcms/core` | existing |
| 12 | Licence | `https://github.com/ianyimi/vex/blob/master/LICENSE` | existing |
| 13 | Privacy | `/privacy` | launch-infrastructure step 13 |
| 14 | Accessibility | `/accessibility` | quality-pass step 11 |
| 15 | Convex | `https://convex.dev` | existing |
| 16 | Convex docs | `https://docs.convex.dev` | existing |

`socialLinks`:

| # | platform | href | icon | Inserted by |
|---|---|---|---|---|
| 1 | GitHub | `https://github.com/ianyimi/vex` | `Github` | existing |
| 2 | GitHub Sponsors | `https://github.com/sponsors/ianyimi` | `Heart` | public-presence step 10 |

## Privacy contact

Questions about privacy or this page: hello@vexcms.dev.

## Release emails privacy entry

Release emails: if you subscribe, your email address is stored by Buttondown, which runs the list and sends one email per release ([Buttondown's privacy policy](https://buttondown.com/legal/privacy)).

## Canonical URLs

- Announcement: https://vexcms.dev/posts/vexcms-0-1-0 (title: "VexCMS 0.1.0"; a draft until D1)
- Brand kit: https://vexcms.dev/brand
- Roadmap: https://docs.vexcms.dev/roadmap/
- Comparison: https://docs.vexcms.dev/compare/
```

Verify: `rg -o "Paid add-ons may come later.*?nothing free becomes paid\." .agent/docs/specs/2026-11-06-public-presence/public-copy.md | sort -u | wc -l` prints `1` (the paid line and the Sponsors bio carry the identical sentence). `rg -ni "pro tier|agency|enterprise|maprios|\bSSO\b|audit log|co-edit|annual licen" .agent/docs/specs/2026-11-06-public-presence/public-copy.md` prints nothing. § Footer has 16 `links` rows and 2 `socialLinks` rows with no repeated label or href: `awk '/^## Footer/,/^## Privacy contact/' .agent/docs/specs/2026-11-06-public-presence/public-copy.md | rg -c '^\| [0-9]+ \|'` prints `18`. `awk '/^## Privacy contact/,/^## Canonical URLs/' .agent/docs/specs/2026-11-06-public-presence/public-copy.md | rg -c '^[A-Z]'` prints `2` (one line under each heading).

### Step 2 — Accounts, addresses and the `vexcms` org [dev]

Why: Sponsors approval takes "a few days" (GitHub docs, `sources.md` §1), and SECURITY.md, the CoC contact, `FUNDING.yml` and the footer links all need real usernames and inboxes. Applying first hides that lead time behind the rest of O, R and T's work. Steps 1–2 also gate launch-infra step 13 (`/privacy`) and quality-pass step 11 (`/accessibility`): both quote `public-copy.md` and publish `hello@vexcms.dev`, which has to deliver mail first. Run them early.

- [ ] Apply for GitHub Sponsors on the personal account `ianyimi`
- [ ] Create a Buy Me a Coffee account
- [ ] Create a Buttondown account
- [ ] Set up `hello@vexcms.dev` and `security@vexcms.dev` DNS forwarding
- [ ] Claim the `vexcms` GitHub organisation
- [ ] Record the new usernames in `public-copy.md`

**GitHub Sponsors application.**

1. Go to `https://github.com/sponsors/accounts` and choose the personal account `ianyimi` (not an organization — Design Decision 7: personal-account sponsorships carry a 0% fee, `sources.md` §1).
2. Fill in: profile details, bank account (Stripe Connect) or fiscal host, tax forms, and enable two-factor authentication — GitHub requires 2FA before it accepts the application (`sources.md` §1).
3. Add the four tiers from `public-copy.md`'s "GitHub Sponsors" table (Design Decision 8) — $3 / $10 / $50 / $250 monthly, published text copied verbatim (tier prices can't be edited once published, `sources.md` §1). Enable one-time and custom amounts.
4. Leave the sponsorship goal unset here — it's set in step 8, once the monthly target is decided.
5. Click "Request approval." Review takes "a few days" (`sources.md` §1); the application shows "pending review" until GitHub acts on it.

**Buy Me a Coffee account.**

1. Go to `https://www.buymeacoffee.com/signup` and create an account for the project (plain link only — Design Decision 9 rules out the embeddable widget, since its script host isn't documented on any unauthenticated primary page, `sources.md` §2).
2. The profile URL is `https://buymeacoffee.com/<bmc-user>`. Note the chosen `<bmc-user>` handle for the edit below.

**Buttondown account.**

1. Go to `https://buttondown.com/signup` and create a free-plan account (Design Decision 10 — the hosted subscribe page, never an inline form; free up to 100 subscribers).
2. Confirm the hosted subscribe page is live at `https://buttondown.com/<buttondown-user>`. Double opt-in is mandatory and configured by default.
3. Note the chosen `<buttondown-user>` handle for the edit below.

**DNS email forwarding.**

1. At the DNS host for `vexcms.dev` (the developer's registrar/DNS provider), add email-forwarding records (most DNS hosts and domain registrars offer this as a built-in "email forwarding" feature — MX + a forwarding rule, no mailbox hosting needed) for:
   - `hello@vexcms.dev` → the developer's inbox
   - `security@vexcms.dev` → the developer's inbox
2. Send a test email to each address and confirm it arrives.

**Claim the `vexcms` organisation.**

1. Go to `https://github.com/organizations/plan` and create the `vexcms` organization on the Free plan (Design Decision 19 — name protection now, the repo transfer itself goes to the backlog in step 19).
2. Leave the org empty — no repos, no transfer. `gh api orgs/vexcms --jq .login` prints `vexcms` once this lands.

#### .agent/docs/specs/2026-11-06-public-presence/public-copy.md

The `<bmc-user>` and `<buttondown-user>` placeholders from step 1 get filled in here, once the accounts above exist.

**1 — fill the Buy Me a Coffee placeholder in the Funding section.** Anchor: the line beginning `Sponsorship pays for time on the free core`.

```markdown
Sponsorship pays for time on the free core: faster bug fixes first, then the free roadmap. Sponsor on [GitHub Sponsors](https://github.com/sponsors/ianyimi) (monthly or one-time), or [buy me a coffee](https://buymeacoffee.com/<bmc-user>).
```

Replace `<bmc-user>` with the real Buy Me a Coffee handle created above.

**2 — fill the Buttondown placeholder in the Follow section.** Anchor: the line beginning `Release emails: one email per release`.

```markdown
Release emails: one email per release, nothing else — [subscribe](https://buttondown.com/<buttondown-user>).
```

Replace `<buttondown-user>` with the real Buttondown handle created above.

**3 — fill the same two placeholders in § Footer.** Anchor: the `links` rows `| 7 | Release emails |` and `| 9 | Buy Me a Coffee |`. Same handles as edits 1 and 2.

Verify: the Sponsors application shows "pending review" or "approved"; a test mail to `hello@vexcms.dev` and one to `security@vexcms.dev` both arrive; `gh api orgs/vexcms --jq .login` prints `vexcms`; `rg -n "bmc-user|buttondown-user" .agent/docs/specs/2026-11-06-public-presence/public-copy.md` returns nothing (both placeholders are filled).

### Step 3 — Label taxonomy and sync script [agent]

Replaces GitHub's 9 default labels with the prefixed taxonomy from Design Decision 13 (`status:` / `area:` / `adapter:` mirror Payload's shape; `type:` replaces organization-only issue types) plus the contributor-routing, resolution and prioritisation labels the forms and starter issues (steps 4, 7) depend on. The `--check` mode is the gate: it diffs the repo's labels against `.github/labels.yml` and cross-checks every issue-form `labels:` entry, so a label an issue form references but the repo doesn't have — which GitHub otherwise skips silently — fails CI instead.

`yaml` is already pinned in the catalog (`yaml: 2.9.0`, used by `packages/create-vexcms`), so this step adds only the root `devDependencies` entry.

- [ ] `package.json`: `"yaml": "catalog:"` added to `devDependencies`
- [ ] `.github/labels.yml` created with the full taxonomy below
- [ ] `scripts/sync-labels.mjs` created: `--check`, default upsert, `--prune`
- [ ] `[dev]` Run `node scripts/sync-labels.mjs --prune` once

#### .github/labels.yml

One color family per prefix (shade varies with the label's position in that prefix's own ordering — triage severity for `status:`, urgency for `priority:`), so the prefix is recognizable at a glance in the label list before the text is read.

```yaml
# status: — issue triage state machine (blue family, darkens with confidence)
- name: "status: needs-triage"
  description: Not yet looked at by a maintainer
  color: C2E0FF
- name: "status: needs-repro"
  description: Reported but missing a reproduction link or clear steps
  color: 76A5EA
- name: "status: verified"
  description: Reproduced by a maintainer
  color: 1D76DB
- name: "status: cant-reproduce"
  description: A maintainer could not reproduce it from the report given
  color: 0B4F9E

# area: — which part of the codebase (purple family, one shade per surface)
- name: "area: core"
  description: "@vexcms/core: fields, collections, access, schema generation"
  color: 8250DF
- name: "area: ui"
  description: The admin panel UI (@vexcms/react)
  color: 8250DF
- name: "area: cli"
  description: "@vexcms/cli: vex dev/deploy/generate"
  color: 8250DF
- name: "area: create-vexcms"
  description: The pnpm create vexcms scaffolder
  color: 8250DF
- name: "area: templates"
  description: "create-vexcms's base-nextjs and marketing-site templates"
  color: 8250DF
- name: "area: docs"
  description: docs.vexcms.dev content or structure
  color: 8250DF
- name: "area: live-preview"
  description: Live preview between the admin panel and the frontend
  color: 8250DF
- name: "area: versions"
  description: Versioning and drafts
  color: 8250DF
- name: "area: auth"
  description: Authentication, roles and access control
  color: 8250DF
- name: "area: storage"
  description: Media uploads and storage adapters
  color: 8250DF

# adapter: — which pluggable package (teal family)
- name: "adapter: better-auth"
  description: "@vexcms/better-auth"
  color: 0B7285
- name: "adapter: next"
  description: "@vexcms/next, the framework adapter"
  color: 0B7285
- name: "adapter: richtext-plate"
  description: "@vexcms/richtext-plate"
  color: 0B7285
- name: "adapter: file-storage-convex"
  description: "@vexcms/file-storage-convex"
  color: 0B7285

# type: — what kind of issue (orange family; no type: question — questions go to Discussions)
- name: "type: bug"
  description: Something doesn't work as documented
  color: D4330C
- name: "type: feature"
  description: A free-tier feature request, filed by a maintainer from Discussions Ideas
  color: FF8C42
- name: "type: docs"
  description: A docs.vexcms.dev correction or gap
  color: FFC999

# contributor routing (GitHub's own historical colors, kept for familiarity)
- name: "good first issue"
  description: Small, scoped, and has acceptance criteria — a good first PR
  color: 7057FF
- name: "help wanted"
  description: A maintainer wants help on this one
  color: 008672

# resolution (gray family, darkens with finality)
- name: duplicate
  description: Already reported or requested elsewhere
  color: CFD3D7
- name: stale
  description: No activity for a long time; may be closed if it stays that way
  color: B0B4B8
- name: invalid
  description: Not a bug, not reproducible as described, or not actionable
  color: 9E9E9E
- name: wontfix
  description: Understood, but won't be worked on
  color: 5A5A5A
- name: BREAKING
  description: A breaking change — called out in the changeset and release notes
  color: 2B2B2B

# roadmap tracking (red-to-yellow priority family, plus the standalone tracking label)
- name: planned
  description: Tracks a post-0.1.0 roadmap item; the docs roadmap links the issue
  color: 0052CC
- name: "roadmap: p0"
  description: Breaks a shipped feature or blocks a release
  color: B60205
- name: "roadmap: p1"
  description: Should land in the next few releases
  color: D93F0B
- name: "roadmap: p2"
  description: Worth doing, no particular urgency
  color: FBCA04
```

Verify: every `description` is ≤100 characters and every `color` is a bare 6-hex value (no `#`). `node -e "const {parse}=require('yaml');const l=parse(require('fs').readFileSync('.github/labels.yml','utf8'));console.log(l.length, l.every(x=>x.description.length<=100 && /^[0-9A-Fa-f]{6}$/.test(x.color)))"` prints `32 true`.

#### scripts/sync-labels.mjs

```javascript
/**
 * Syncs GitHub repo labels from `.github/labels.yml`, the single source of
 * truth for the label taxonomy.
 *
 * Modes, selected by CLI flag (default with no flag: upsert):
 * - (no flag): `gh label create --force` for every entry in the file — creates
 *   missing labels, updates the color/description of existing ones. Never
 *   deletes.
 * - `--prune`: upsert, then deletes every repo label absent from the file.
 * - `--check`: reports drift and exits non-zero without changing anything.
 *   Drift is (a) any repo label whose name/description/color doesn't match
 *   the file, any label in the file missing from the repo, or any extra repo
 *   label the file doesn't declare; and (b) any `labels:` entry in
 *   `.github/ISSUE_TEMPLATE/*.yml` that isn't in the file — the silent-skip
 *   GitHub documents for a form label the repo doesn't have.
 *
 * Repo target: `process.env.GITHUB_REPOSITORY`, or `gh repo view --json
 * nameWithOwner` when unset (local runs outside CI).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { parse as parseYaml } from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const labelsPath = path.join(root, ".github/labels.yml");
const issueTemplateDir = path.join(root, ".github/ISSUE_TEMPLATE");

/**
 * Reads and parses `.github/labels.yml`.
 *
 * @returns {Array<{ name: string, description: string, color: string }>}
 */
function readLabelsFile() {
  const raw = fs.readFileSync(labelsPath, "utf-8");
  return parseYaml(raw);
}

/**
 * Resolves the `owner/repo` slug to operate on.
 *
 * @returns {string}
 */
function resolveRepoSlug() {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  const out = execFileSync("gh", ["repo", "view", "--json", "nameWithOwner"], {
    cwd: root,
    encoding: "utf-8",
  });
  return JSON.parse(out).nameWithOwner;
}

/**
 * Fetches the repo's current labels via `gh label list`.
 *
 * @param {string} repo - `owner/repo`.
 * @returns {Array<{ name: string, description: string, color: string }>}
 */
function fetchRepoLabels(repo) {
  const out = execFileSync(
    "gh",
    [
      "label",
      "list",
      "--repo",
      repo,
      "--limit",
      "200",
      "--json",
      "name,description,color",
    ],
    { cwd: root, encoding: "utf-8" },
  );
  return JSON.parse(out);
}

/**
 * Creates or updates every label from the file. Idempotent: `--force` makes
 * a repeat run a no-op diff.
 *
 * @param {string} repo - `owner/repo`.
 * @param {Array<{ name: string, description: string, color: string }>} labels
 */
function upsertLabels(repo, labels) {
  for (const label of labels) {
    execFileSync(
      "gh",
      [
        "label",
        "create",
        label.name,
        "--repo",
        repo,
        "--description",
        label.description,
        "--color",
        label.color,
        "--force",
      ],
      { cwd: root, stdio: "inherit" },
    );
  }
}

/**
 * Deletes every repo label not present in the file.
 *
 * @param {string} repo - `owner/repo`.
 * @param {Array<{ name: string }>} fileLabels
 * @param {Array<{ name: string }>} repoLabels
 */
function pruneLabels(repo, fileLabels, repoLabels) {
  const fileNames = new Set(fileLabels.map((l) => l.name));
  for (const repoLabel of repoLabels) {
    if (fileNames.has(repoLabel.name)) continue;
    execFileSync(
      "gh",
      ["label", "delete", repoLabel.name, "--repo", repo, "--yes"],
      { cwd: root, stdio: "inherit" },
    );
  }
}

/**
 * Diffs the file against the repo's current labels.
 *
 * @param {Array<{ name: string, description: string, color: string }>} fileLabels
 * @param {Array<{ name: string, description: string, color: string }>} repoLabels
 * @returns {string[]} human-readable violations; empty means no drift.
 */
function diffLabels(fileLabels, repoLabels) {
  const violations = [];
  const repoByName = new Map(repoLabels.map((l) => [l.name, l]));
  const fileNames = new Set(fileLabels.map((l) => l.name));

  for (const fileLabel of fileLabels) {
    const repoLabel = repoByName.get(fileLabel.name);
    if (!repoLabel) {
      violations.push(`missing from repo: "${fileLabel.name}"`);
      continue;
    }
    if (
      repoLabel.description !== fileLabel.description ||
      repoLabel.color.toUpperCase() !== fileLabel.color.toUpperCase()
    ) {
      violations.push(
        `drifted: "${fileLabel.name}" repo={description: ${repoLabel.description}, color: ${repoLabel.color}} file={description: ${fileLabel.description}, color: ${fileLabel.color}}`,
      );
    }
  }

  for (const repoLabel of repoLabels) {
    if (!fileNames.has(repoLabel.name)) {
      violations.push(`extra in repo, not in file: "${repoLabel.name}"`);
    }
  }

  return violations;
}

/**
 * Parses every `.github/ISSUE_TEMPLATE/*.yml` form and asserts each of its
 * `labels:` entries exists in the taxonomy file — the check for the failure
 * mode GitHub itself does not surface: a form label the repo doesn't have is
 * silently skipped when the issue is created.
 *
 * @param {Set<string>} knownLabelNames
 * @returns {string[]} human-readable violations; empty means every form label
 *   resolves.
 */
function checkFormLabels(knownLabelNames) {
  const violations = [];
  if (!fs.existsSync(issueTemplateDir)) return violations;
  const files = fs
    .readdirSync(issueTemplateDir)
    .filter((f) => f.endsWith(".yml") && f !== "config.yml");

  for (const file of files) {
    const raw = fs.readFileSync(path.join(issueTemplateDir, file), "utf-8");
    const form = parseYaml(raw);
    const formLabels = Array.isArray(form.labels) ? form.labels : [];
    for (const labelName of formLabels) {
      if (!knownLabelNames.has(labelName)) {
        violations.push(`"${file}" references unknown label "${labelName}"`);
      }
    }
  }

  return violations;
}

const cliArgs = process.argv.slice(2);
const check = cliArgs.includes("--check");
const prune = cliArgs.includes("--prune");

const fileLabels = readLabelsFile();
const repo = resolveRepoSlug();

if (check) {
  const repoLabels = fetchRepoLabels(repo);
  const violations = [
    ...diffLabels(fileLabels, repoLabels),
    ...checkFormLabels(new Set(fileLabels.map((l) => l.name))),
  ];
  if (violations.length > 0) {
    console.error(`sync-labels --check found ${violations.length} issue(s):`);
    for (const violation of violations) console.error(`  - ${violation}`);
    process.exit(1);
  }
  console.log("sync-labels --check: no drift");
  process.exit(0);
}

upsertLabels(repo, fileLabels);

if (prune) {
  const repoLabels = fetchRepoLabels(repo);
  pruneLabels(repo, fileLabels, repoLabels);
}

console.log(`sync-labels: synced ${fileLabels.length} label(s) to ${repo}${prune ? " (pruned extras)" : ""}`);
```

Verify: `node scripts/sync-labels.mjs --check` exits 1 against today's repo (default labels, the prefixed set missing) and exits 0 after `node scripts/sync-labels.mjs --prune`. `gh label list --repo ianyimi/vex --limit 100 --json name --jq 'length'` equals 32, the entry count in `labels.yml`. Negative test (AP-013): add a bogus `labels: ["nope"]` to `.github/ISSUE_TEMPLATE/1-bug_report.yml` (step 4) and confirm `--check` exits 1 with `references unknown label "nope"`; revert it afterwards.

### Step 4 — Issue forms, template chooser and PR template [agent]

Two issue forms (bug, docs) plus a `config.yml` that disables blank issues and routes everything else to Discussions or private vulnerability reporting (Design Decisions 13, 15, 16). Feature requests are explicitly not a form: Decision 15 routes them to Discussions → Ideas, and a maintainer re-files an accepted idea as a `type: feature` issue by hand.

- [ ] `.github/ISSUE_TEMPLATE/1-bug_report.yml` created
- [ ] `.github/ISSUE_TEMPLATE/2-docs_issue.yml` created
- [ ] `.github/ISSUE_TEMPLATE/config.yml` created
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` created

#### .github/ISSUE_TEMPLATE/1-bug_report.yml

```yaml
name: Bug report
description: Something doesn't work as documented
labels: ["type: bug", "status: needs-triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to report a bug. A reproduction (even a minimal one) is the single
        biggest thing that speeds up a fix — Convex-backed repros are costly to build from scratch, so
        a link isn't required, but detailed steps are.

  - type: input
    id: versions
    attributes:
      label: Versions
      description: "The `@vexcms/*` package versions, `convex`, and `next`, e.g. `@vexcms/core@0.1.0-alpha.11, convex@1.44.0, next@16.4.3`"
      placeholder: "@vexcms/core@0.1.0-alpha.x, convex@x.x.x, next@x.x.x"
    validations:
      required: true

  - type: dropdown
    id: adapters
    attributes:
      label: Which adapters are in use?
      description: Informational only — this does not apply a label automatically.
      multiple: true
      options:
        - "@vexcms/better-auth"
        - "@vexcms/file-storage-convex"
        - "@vexcms/richtext-plate"
        - None of these
    validations:
      required: false

  - type: input
    id: reproduction-link
    attributes:
      label: Reproduction link (optional)
      description: A minimal repo, StackBlitz, or branch that reproduces the issue.
      placeholder: https://github.com/you/minimal-repro
    validations:
      required: false

  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
      description: Numbered steps from a fresh `pnpm create vexcms@alpha` (or your own setup) to the bug.
      placeholder: |
        1. ...
        2. ...
        3. ...
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: Actual behavior
    validations:
      required: true

  - type: textarea
    id: logs
    attributes:
      label: Relevant log output
      description: Paste any error output, stack trace, or console output. This will be formatted as a code block.
      render: shell
    validations:
      required: false
```

#### .github/ISSUE_TEMPLATE/2-docs_issue.yml

```yaml
name: Docs issue
description: A docs.vexcms.dev correction or gap
labels: ["type: docs", "area: docs", "status: needs-triage"]
body:
  - type: input
    id: page-url
    attributes:
      label: Page URL
      placeholder: https://docs.vexcms.dev/fields/richtext/
    validations:
      required: true

  - type: textarea
    id: whats-wrong
    attributes:
      label: What's wrong?
      description: Incorrect, missing, outdated, or unclear — be as specific as you can.
    validations:
      required: true

  - type: textarea
    id: suggested-fix
    attributes:
      label: Suggested fix
      description: Optional — if you already know what the page should say instead.
    validations:
      required: false
```

#### .github/ISSUE_TEMPLATE/config.yml

```yaml
blank_issues_enabled: false
contact_links:
  - name: Ask a question
    url: https://github.com/ianyimi/vex/discussions/categories/q-a
    about: Questions about using VexCMS go to Discussions, not issues.
  - name: Suggest a feature
    url: https://github.com/ianyimi/vex/discussions/categories/ideas
    about: Feature ideas go to Discussions. A 👍'd idea becomes a tracked issue.
  - name: Report a security vulnerability
    url: https://github.com/ianyimi/vex/security/advisories/new
    about: Please don't open a public issue for a security report.
```

#### .github/PULL_REQUEST_TEMPLATE.md

```markdown
## What

<!-- What does this PR change, and why? -->

Closes #<!-- issue number, if any -->

## Checklist

- [ ] A changeset is added (`pnpm changeset` — pick `patch`; VexCMS is pre-1.0, every release is a patch)
- [ ] Tests added or updated for the behavior this PR changes
- [ ] Docs updated (`apps/docs`), if this changes a public API or documented behavior
```

Verify: `node scripts/sync-labels.mjs --check` exits 0, which proves `type: bug`, `status: needs-triage`, `type: docs`, `area: docs` all exist in `labels.yml`. `node -e "const {parse}=require('yaml');['1-bug_report','2-docs_issue'].forEach(f=>parse(require('fs').readFileSync('.github/ISSUE_TEMPLATE/'+f+'.yml','utf8')))"` succeeds without throwing. After the Release merge, the "New issue" page on `master` shows exactly the two forms plus the three contact links above, and `blank_issues_enabled: false` hides the blank-issue option from non-maintainers.

### Step 5 — CONTRIBUTING, CODE_OF_CONDUCT, SECURITY [dev]

Three of the five files GitHub's community-profile check counts (`sources.md` §5), and the first signal a launch-day visitor sees that the project is maintained, not abandoned. SECURITY.md only works once step 6 turns on private vulnerability reporting.

- [ ] `CONTRIBUTING.md` created
- [ ] `CODE_OF_CONDUCT.md` created
- [ ] `SECURITY.md` created

#### CONTRIBUTING.md

````markdown
# Contributing to VexCMS

VexCMS is built and maintained by one developer, [@ianyimi](https://github.com/ianyimi), in their free
time. New issues are triaged within a week; how fast a fix lands depends on its severity and on
sponsorship.

## Where things go

| You have... | Goes to |
|---|---|
| A question about using VexCMS | [Discussions → Q&A](https://github.com/ianyimi/vex/discussions/categories/q-a) |
| An idea for a new feature | [Discussions → Ideas](https://github.com/ianyimi/vex/discussions/categories/ideas) — a 👍'd idea becomes a tracked issue |
| A reproducible bug | [an issue](https://github.com/ianyimi/vex/issues/new/choose) |
| A docs correction | [an issue](https://github.com/ianyimi/vex/issues/new/choose) |
| A security vulnerability | [private vulnerability reporting](https://github.com/ianyimi/vex/security/advisories/new) (preferred) or `security@vexcms.dev` — never a public issue |

## Dev setup

```bash
git clone https://github.com/ianyimi/vex.git
cd vex
pnpm install
```

The root scripts run everything through [Turborepo](https://turbo.build):

| Command | What it does |
|---|---|
| `pnpm build` | Builds every package and app |
| `pnpm typecheck` | Typechecks the whole workspace |
| `pnpm test` | Runs Vitest in every package that has tests |
| `pnpm lint` / `pnpm lint:fix` | ESLint over `packages/*/src/**/*.{ts,tsx}` |
| `pnpm changeset` | Records a changeset entry for your change (see below) |

To target one package or app, use `pnpm --filter <name> <script>` — e.g. `pnpm --filter @vexcms/core test`.

`apps/www` and `apps/test` need their own Convex deployment to run (`npx convex dev` inside the app
directory, same as the [quick start](README.md#quick-start)) — not required for working on
`packages/*`, which test and typecheck standalone.

## Changesets

Every PR that changes published package behavior needs a changeset:

```bash
pnpm changeset
```

Pick the packages your change touches and `patch` as the bump — VexCMS is pre-1.0, so every release is
a patch (there's no `minor`/`major` distinction yet). Write a one-line summary; it becomes a line in
the package's CHANGELOG.

## Reproduction bar

Bug reports need either a reproduction link or clear numbered steps from a fresh install — not both.
A Convex-backed repro is a real ask for a stranger to set up, so the bar is "I can follow these steps
and see the bug," not "there's a hosted repo."

## What `status:` means

| Label | Meaning |
|---|---|
| `status: needs-triage` | Not yet looked at by a maintainer |
| `status: needs-repro` | Reported but missing a reproduction link or clear steps |
| `status: verified` | Reproduced by a maintainer |
| `status: cant-reproduce` | A maintainer could not reproduce it from the report given |

## Before you open a PR

- Check for an existing issue or discussion first — a PR without one may be closed and asked to start there.
- Keep the diff scoped to the issue. Unrelated cleanups make review slower, not faster.
- Follow the [naming conventions](https://docs.vexcms.dev/dev/naming-conventions/) — file names, export
  shapes, and test placement are checked in review.

## PR checklist

- [ ] A changeset is added (`pnpm changeset`, `patch`)
- [ ] Tests added or updated for the behavior you changed
- [ ] Docs updated (`apps/docs`), if this changes a public API or documented behavior
- [ ] `pnpm typecheck && pnpm test && pnpm lint` pass locally

## Repo map

| Path | What's there |
|---|---|
| `packages/core` | Field system, collections, access control, schema/type generation |
| `packages/react` | The admin panel UI |
| `packages/next` | The Next.js framework adapter |
| `packages/cli` | `vex` — `dev`, `deploy`, `generate` |
| `packages/better-auth` | The Better Auth integration |
| `packages/file-storage-convex` | The Convex file-storage adapter |
| `packages/richtext-plate` | The richtext field's Plate.js editor |
| `packages/create-vexcms` | `pnpm create vexcms` scaffolder and its templates |
| `apps/www` | vexcms.dev, built on VexCMS itself |
| `apps/docs` | docs.vexcms.dev (Astro + Starlight) |
| `scripts/` | Repo-wide checks and sync scripts, run from root `package.json` |
````

#### CODE_OF_CONDUCT.md

Fetch `https://www.contributor-covenant.org/version/3/0/code_of_conduct/code_of_conduct.md` verbatim
and save it as `CODE_OF_CONDUCT.md`, unchanged, **except** the reporting line in "Reporting an Issue."
The fetched file reads:

```markdown
When an incident does occur, it is important to report it promptly. To report a possible violation, **[NOTE: describe your means of reporting here.]**
```

Replace only the bracketed placeholder:

```markdown
When an incident does occur, it is important to report it promptly. To report a possible violation, email **hello@vexcms.dev**.
```

Every other line — including the "Addressing and Repairing Harm" editorial note, the enforcement
ladder, and the Attribution section — stays exactly as fetched. The Attribution section (keep verbatim,
it carries the required CC BY-SA 4.0 credit):

```markdown
## Attribution

This Code of Conduct is adapted from the Contributor Covenant, version 3.0, permanently available at [https://www.contributor-covenant.org/version/3/0/](https://www.contributor-covenant.org/version/3/0/).

Contributor Covenant is stewarded by the Organization for Ethical Source and licensed under CC BY-SA 4.0. To view a copy of this license, visit [https://creativecommons.org/licenses/by-sa/4.0/](https://creativecommons.org/licenses/by-sa/4.0/)

For answers to common questions about Contributor Covenant, see the FAQ at [https://www.contributor-covenant.org/faq](https://www.contributor-covenant.org/faq). Translations are provided at [https://www.contributor-covenant.org/translations](https://www.contributor-covenant.org/translations). Additional enforcement and community guideline resources can be found at [https://www.contributor-covenant.org/resources](https://www.contributor-covenant.org/resources). The enforcement ladder was inspired by the work of [Mozilla's code of conduct team](https://github.com/mozilla/inclusion).
```

#### SECURITY.md

```markdown
# Security Policy

## Supported versions

Only the latest `0.1.x` release is supported. VexCMS is pre-1.0 and alphas don't carry a migration
path between them — please upgrade to the latest release before reporting.

## Reporting a vulnerability

Please don't open a public issue for a security report.

1. **Preferred:** use [private vulnerability reporting](https://github.com/ianyimi/vex/security/advisories/new)
   on this repo. It opens a private draft advisory only you and the maintainer can see.
2. **If that isn't an option:** email `security@vexcms.dev`.

Reports are acknowledged within a week.

## Disclosure

Once a fix is ready, the report is disclosed through a published GitHub Security Advisory, crediting
the reporter (unless you ask not to be credited). We'll coordinate the disclosure timeline with you
before publishing.
```

Verify: `pnpm exec prettier --check CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md`. Every command named in CONTRIBUTING's dev setup (`pnpm install`, `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint`) is run on a fresh clone. Every address and URL in the three files resolves — `hello@vexcms.dev` and `security@vexcms.dev` depend on step 2's DNS forwarding being live.

### Step 6 — Repo settings: Discussions, private vulnerability reporting, social preview [dev]

Discussions is the only support channel at launch (no Discord at launch). Private vulnerability
reporting is what `SECURITY.md` just promised. The social preview card is what every shared link shows
from launch day on.

- [ ] Enable Discussions, trim categories to four, pin a welcome post
- [ ] Enable private vulnerability reporting
- [ ] `.github/assets/social-preview.png` created and uploaded
- [ ] Wiki turned off

**Enable Discussions.**

```bash
gh api -X PATCH repos/ianyimi/vex -F has_discussions=true
```

In the UI (Discussions tab → pencil icon next to "Categories" — category management has no API,
`sources.md` §7): delete **General** and **Polls**. Keep **Q&A** (Question and Answer format — enable
"mark as answer"), **Ideas**, **Show and tell**, **Announcements**.

Start a new discussion in **Announcements** (only maintainers can start one there) titled "Welcome to
VexCMS Discussions" using the support-channel line from `public-copy.md`:

```markdown
# Welcome to VexCMS Discussions

Questions and ideas go here. Bugs go to [issues](https://github.com/ianyimi/vex/issues/new/choose).
Security reports go to [private vulnerability reporting](https://github.com/ianyimi/vex/security/advisories/new)
or security@vexcms.dev — never a public issue.

- **Q&A** — ask how to do something, or why something behaves the way it does
- **Ideas** — suggest a feature; a 👍'd idea becomes a tracked issue
- **Show and tell** — share what you built with VexCMS
```

Pin it (Discussions tab → the discussion's `...` menu → **Pin discussion**).

**Enable private vulnerability reporting.**

```bash
gh api -X PUT repos/ianyimi/vex/private-vulnerability-reporting
```

Expect an empty `204` response (`sources.md` §6). Verify with:

```bash
gh api repos/ianyimi/vex/private-vulnerability-reporting --jq .enabled
```

**Social preview card.**

Brief (from `.agent/docs/specs/2026-08-30-wp4-docs-repo-polish/github-page.md`): canvas 1280×640px,
PNG or JPG under 1MB; title text `VexCMS`; one-liner directly under it, `Type-safe headless CMS for
Convex`; keep all text inside the center ~1100×540px safe area; dark background matching the README
hero, type-only (no screenshot — the admin panel screenshot slot in that spec's plan is still empty).

Build the source PNG at 1280×640 and save it at `.github/assets/social-preview.png` (same directory as
the existing `.github/assets/preview.png`, so both are version-controlled). Upload it: repo → **Settings**
→ scroll to **Social preview** (under Features, near the bottom of General settings) → **Edit** → upload
`.github/assets/social-preview.png`.

**Turn off the Wiki.**

Repo → **Settings** → **General** → **Features** → uncheck **Wikis**. Equivalent API call:

```bash
gh api -X PATCH repos/ianyimi/vex -F has_wiki=false
```

**Verify categories (GraphQL).**

```bash
gh api graphql -f query='
  query {
    repository(owner: "ianyimi", name: "vex") {
      discussionCategories(first: 25) {
        nodes { name isAnswerable }
      }
    }
  }
'
```

Verify: `gh api repos/ianyimi/vex --jq .has_discussions` prints `true`. The GraphQL query above lists
exactly `Q&A` (`isAnswerable: true`), `Ideas`, `Show and tell`, `Announcements` — four nodes, no
`General`, no `Polls`. `gh api repos/ianyimi/vex/private-vulnerability-reporting --jq .enabled` prints
`true`. `gh api repos/ianyimi/vex --jq .has_wiki` prints `false`. Pasting `https://github.com/ianyimi/vex`
into a link unfurler (Slack message box preview, Discord embed, or the X card validator) shows the new
card instead of GitHub's generic fallback.

### Step 7 — Starter issues [agent drafts, dev files]

Every post-0.1.0 roadmap item (`public-copy.md`'s "Roadmap — after 0.1.0") needs a 👍-countable
`planned` issue the docs roadmap links to (step 9), and launch visitors who want to help need scoped
work with acceptance criteria already written, not a bare "help wanted" label.

- [ ] `issues/` — 8 `planned` drafts created (plugin system, localization, scheduled publishing,
      TanStack Start adapter, form builder, outbound webhooks, API keys + team management, brownfield
      adoption)
- [ ] `issues/` — 5 `good first issue` drafts created, plus 1 `help wanted` draft
- [ ] `[dev]` File each one with `gh issue create`, then record the numbers in `public-copy.md`

**Draft file format.**

Each draft is `issues/<slug>.md`: a two-line YAML-ish header (`title:`, `labels:`), a blank line, then
the body GitHub receives verbatim.

```markdown
title: <issue title>
labels: <comma-separated label names>

## Context

<!-- why this exists / what prompted it -->

## Scope

<!-- what this issue covers, in one paragraph -->

## Acceptance criteria

- [ ] <criterion>

## Out of scope

<!-- what this issue deliberately does not cover -->
```

**The 8 `planned` drafts (free-tier only — public-copy.md § Roadmap — after 0.1.0).**

#### .agent/docs/specs/2026-11-06-public-presence/issues/plugin-system.md

```markdown
title: Plugin system
labels: planned, type: feature

## Context

0.1.0 ships the extension points (admin slots, component overrides, action contributions) a plugin
system needs, but nothing outside the core packages can register against them yet.

## Scope

A `definePlugin({ id, requires, client, server })` API with typed contributions to any part of a
VexCMS config — collections, fields, hooks, access resources, routes, admin slots, server functions,
CLI hooks — plus declared inter-plugin dependencies and a `renderDefault` chain so a plugin can wrap
rather than replace a built-in. First-party packages (`@vexcms/better-auth`,
`@vexcms/file-storage-convex`, `@vexcms/richtext-plate`) become the reference implementations, dog-
fooding the same API third-party plugin authors use.

## Acceptance criteria

- [ ] A third-party plugin can add a collection, a field type, and an admin-slot contribution without
      forking `@vexcms/core`
- [ ] `@vexcms/better-auth` is rewritten as a plugin using the new API with no behavior change
- [ ] The plugin API and authoring guide are documented in `apps/docs`

## Out of scope

A plugin marketplace or registry.
```

#### .agent/docs/specs/2026-11-06-public-presence/issues/localization.md

```markdown
title: Localization
labels: planned, type: feature, area: core

## Context

VexCMS has no per-field locale support today; every value is stored once, globally.

## Scope

Per-field locale values, opted into per collection and per field, with locale-aware drafts. Values for
a locale that hasn't been translated yet fall back to the collection's default locale rather than
rendering empty.

## Acceptance criteria

- [ ] A field can be marked `localized: true` and store a distinct value per configured locale
- [ ] The admin panel has a locale switcher on the edit view for a document with localized fields
- [ ] Drafts are locale-aware: publishing one locale doesn't publish other locales' drafts

## Out of scope

Machine translation and translation-approval workflows.
```

#### .agent/docs/specs/2026-11-06-public-presence/issues/scheduled-publishing.md

```markdown
title: Scheduled publishing
labels: planned, type: feature, area: versions

## Context

Publishing and unpublishing happen immediately today; there's no way to queue either for a future time.

## Scope

A `publishAt` (and optionally `unpublishAt`) field on versioned documents, executed by Convex's
scheduler, reusing the existing `publish` write path so hooks and validation still run when the
scheduled time arrives.

## Acceptance criteria

- [ ] Setting a future `publishAt` on a draft publishes it automatically at that time, visible to
      anonymous readers from that moment on
- [ ] Canceling a scheduled publish before it fires leaves the document as a draft
- [ ] The admin edit view shows the pending scheduled time and a cancel action

## Out of scope

Recurring/repeating publish schedules.
```

#### .agent/docs/specs/2026-11-06-public-presence/issues/tanstack-start-adapter.md

```markdown
title: TanStack Start adapter
labels: planned, type: feature, area: core

## Context

`@vexcms/next` is the only framework adapter today; the admin panel and its caching helpers are
Next.js-specific.

## Scope

A `@vexcms/tanstack-start` package mirroring `@vexcms/next`'s public surface (admin panel mount,
server config wiring, caching/revalidation helpers) on TanStack Start, built against the same
framework-adapter seam `@vexcms/next` already uses internally.

## Acceptance criteria

- [ ] A TanStack Start app can mount the full admin panel via the new package, with the same field
      types and access-control behavior as the Next.js adapter
- [ ] `create-vexcms` can scaffold a TanStack Start project
- [ ] The adapter is documented in `apps/docs` alongside the Next.js guide

## Out of scope

Any framework adapter other than TanStack Start.
```

#### .agent/docs/specs/2026-11-06-public-presence/issues/form-builder.md

```markdown
title: Form builder
labels: planned, type: feature, area: core

## Context

There's no way today to collect input from site visitors through VexCMS-managed content; a contact
form needs to be hand-built outside the admin.

## Scope

An admin-authored form builder: an editor-defined set of fields (reusing the leaf field types),
generated client-side + server-side validation from that definition, and a submissions collection
storing each response. Public submissions are rate-limited and spam-protected (no such protection
exists for anonymous `create` today; this issue adds it).

## Acceptance criteria

- [ ] An editor can define a form (fields, labels, validation) in the admin without writing code
- [ ] A published form renders on the frontend and a submission is validated and stored
- [ ] Submissions are viewable in the admin, scoped by role like any other collection

## Out of scope

Payment collection, file uploads inside form submissions, or third-party form-service integrations.
```

#### .agent/docs/specs/2026-11-06-public-presence/issues/outbound-webhooks.md

```markdown
title: Outbound webhooks
labels: planned, type: feature, area: core

## Context

Nothing in VexCMS notifies an external service when content changes; integrations have to poll.

## Scope

Admin-configured webhook endpoints, triggered by the existing `afterChange`/`afterDelete` lifecycle
hooks, with a signed payload (so the receiver can verify origin), configurable per collection, and a
delivery log with retry on failure.

## Acceptance criteria

- [ ] A webhook can be registered against a collection's change events from the admin
- [ ] A content change delivers a signed POST to the configured URL, with a visible delivery log
- [ ] A failed delivery retries with backoff and the failure is visible in the admin

## Out of scope

An outbound-webhook marketplace or pre-built third-party integrations (Slack, Zapier, etc.) — those
can be built on top of this once it ships.
```

#### .agent/docs/specs/2026-11-06-public-presence/issues/api-keys-team-management.md

```markdown
title: API keys and team management
labels: planned, type: feature, area: auth

## Context

Better Auth's `apiKey` plugin schema already exists in the generated auth tables, but nothing in
VexCMS issues or scopes keys, and there's no way to invite a teammate or assign them a role from the
admin panel.

## Scope

Admin UI to invite a user, assign one of the project's configured roles, and issue a scoped API key
(read-only or read/write, optionally limited to specific collections) for reading or writing content
from outside the admin panel.

## Acceptance criteria

- [ ] An admin can invite a user by email and assign a role, without touching the Convex dashboard
- [ ] An admin can issue an API key scoped to specific collections and permissions, and revoke it
- [ ] A request authenticated with an API key is subject to the same access-control rules as a signed-in
      user with the key's assigned role

## Out of scope

Identity-provider integrations.
```

#### .agent/docs/specs/2026-11-06-public-presence/issues/brownfield-adoption.md

```markdown
title: Brownfield adoption
labels: planned, type: feature, area: core

## Context

VexCMS today assumes it owns every table it manages. A team with an existing, hand-written Convex app
has no way to bring VexCMS in without a data migration.

## Scope

Let a collection bind to a Convex table VexCMS did not create: keep the table's existing index names,
opt out of auto-generated indexes, and avoid writing any reserved `vex_`-prefixed field unless the
table is explicitly opted into versioning. Pairs with an introspection command that generates a
starting `defineCollection` from an existing `defineTable` validator.

## Acceptance criteria

- [ ] An existing Convex table with production data can be adopted as a collection with zero data
      migration
- [ ] `vex` can introspect an existing schema file and generate a starting collection definition
- [ ] Existing hand-written Convex functions against the adopted table keep working unmodified

## Out of scope

Adopting tables owned by a Convex component.
```

**Good first issue / help wanted drafts (from `backlog.md` and `.agent/docs/tasks.md`'s inbox).**

#### .agent/docs/specs/2026-11-06-public-presence/issues/collapse-duplicate-types.md

```markdown
title: Collapse duplicate exported types (VexMediaCreateMediaDocumentArgs / DraggableContextValue)
labels: good first issue, type: bug, area: core

## Context

A structural duplicate-member scan over `packages/*/src`'s exported interfaces found pairs of types
that describe the same shape under two different names. Two names for one concept forces every reader
to prove they're the same thing, and lets them drift apart silently. Two pairs remain:

- `VexMediaCreateMediaDocumentArgs` (`packages/core/src/api/convex.ts`) vs
  `CreateMediaDocumentClientArgs` (`packages/core/src/media/api/types.ts`) — identical 8 members
- `DraggableContextValue` (`packages/react/src/ui/dnd/context.ts`) vs `DragHandleContextValue`
  (`packages/react/src/ui/dnd/Draggable.tsx`) — both `{ dragHandleProps, isDragging }`

## Scope

Pick one name per pair, keep it, and update every import site to match — mechanical, no behavior
change. `lsp rename` (or your editor's rename-symbol) across each pair's usages is the intended tool.

## Acceptance criteria

- [ ] Only one of the two type names survives per pair; the other is deleted, not re-exported as an
      alias
- [ ] `pnpm typecheck` passes with no new errors
- [ ] A changeset is added for `@vexcms/core` and `@vexcms/react` if either type is publicly exported
      from the package's entry point (check `src/index.ts`)

## Out of scope

Any type outside these two pairs.
```

#### .agent/docs/specs/2026-11-06-public-presence/issues/list-view-title-touch-target.md

```markdown
title: List-view row title links are 16px-tall touch targets on mobile
labels: good first issue, type: bug, area: ui

## Context

The `useAsTitle` link in every data-table row renders at 16px tall — the text's own line box, with no
padding — well under the 44px (Apple HIG) / 48dp (Android) minimum touch-target guidance. Measured on
`/admin/pages` and `/admin/themes` at 375px and 390px widths during a mobile audit.

## Scope

Give the row title link a real touch target — padding or `min-h` on the link itself is the smallest
fix. Making the entire cell clickable is a larger change (affects desktop row density too) and is not
required for this issue.

## Acceptance criteria

- [ ] The title link's tappable area is at least 44px tall at 375px/390px viewport widths
- [ ] Desktop row height and density are visually unchanged
- [ ] A changeset is added for `@vexcms/react`

## Out of scope

Making the whole row clickable — that's a design call (row density), not a padding fix.
```

#### .agent/docs/specs/2026-11-06-public-presence/issues/upload-failure-toast.md

```markdown
title: Show a toast when media upload fails instead of only logging to console
labels: good first issue, type: bug, area: ui

## Context

`MediaUploadForm.tsx`'s submit handler catches a failed upload (network error, storage error) with
only `console.error("Upload failed:", error)` — nothing tells the person using the admin panel that
anything went wrong. The rest of the admin panel uses `sonner`'s `toast` for exactly this (see
`packages/react/src/documents/DocumentSaveAction.tsx` or `packages/react/src/versions/VersionHistoryPanel.tsx`
for the established pattern, including `getVexErrorMessage(error)` for a readable message). A test for
this is already written and skipped: `packages/react/src/fields/upload/Field.test.tsx`, the
`it.skip("[finding] recovers from a failed storage upload...")` case, with a comment pointing at the
exact fix needed.

## Scope

Replace the `console.error` + `// TODO: Show error toast` in `packages/react/src/media/MediaUploadForm.tsx`'s
catch block with `toast.error(getVexErrorMessage(error))`, matching the pattern used elsewhere in the
package. Un-skip the existing test.

## Acceptance criteria

- [ ] A failed upload shows an accessible error toast (not just a console log)
- [ ] The skipped test in `Field.test.tsx` is un-skipped and passes
- [ ] A changeset is added for `@vexcms/react`

## Out of scope

Retry-on-failure behavior — the test's own comment notes the staged file survives for a retry already;
this issue is only about surfacing the error.
```

#### .agent/docs/specs/2026-11-06-public-presence/issues/admin-not-found-screens.md

```markdown
title: Wire the existing AdminNotFound component into its 6 remaining TODO call sites
labels: good first issue, type: bug, area: ui

## Context

`packages/react/src/admin/AdminNotFound.tsx` is a shared not-found component, and its own JSDoc says
it "replaces every 'TODO: add not found view' text block" — but the call sites were never migrated.
Six still render a bare `<p>Collection not found.</p>`-style placeholder instead:
`packages/react/src/collections/editView/CollectionEditView.tsx` (3 call sites — collection, document,
and currentDocument not-found branches), `packages/react/src/globals/GlobalEditView.tsx` (1),
`packages/react/src/media/MediaCollectionEditView.tsx` (2).

## Scope

Replace each placeholder `<p>...</p>` with `<AdminNotFound variant="..." detail="..." backHref="..."
backLabel="..." />`, picking the right `variant` (`"collection" | "global" | "document"`) and `backHref`
for each case — `AdminNotFound`'s own JSDoc has a worked example.

## Acceptance criteria

- [ ] All 6 call sites render `AdminNotFound` instead of a bare paragraph
- [ ] Each one passes a `detail` string including the caller-supplied slug/id (not a config-derived
      label — see `AdminNotFoundProps.detail`'s own doc comment for why)
- [ ] A changeset is added for `@vexcms/react`

## Out of scope

Any other "not found" state in the codebase not listed above.
```

#### .agent/docs/specs/2026-11-06-public-presence/issues/docs-llms-txt-check.md

```markdown
title: Add a CI check that apps/docs' llms.txt outputs stay in sync with the sidebar
labels: good first issue, type: docs, area: docs

## Context

`apps/docs` serves `llms.txt`/`llms-full.txt`/`llms-small.txt` (via `starlight-llms-txt`) as an index
of the docs for AI coding agents, generated from the Starlight sidebar config in
`apps/docs/astro.config.mjs`. There's no check today that a new sidebar entry actually shows up in the
generated output, so a page can be added to the docs and silently missing from the llms.txt index.

## Scope

A small script (mirroring `scripts/check-packed-manifests.mjs`'s style — JSDoc, `--check` exits
non-zero on drift) that builds the docs site, reads the generated `llms.txt`, and asserts every page
listed in the sidebar config has a corresponding entry.

## Acceptance criteria

- [ ] The script fails when a sidebar entry is added without a matching docs page/llms.txt entry
      (negative test)
- [ ] The script passes against the current docs site
- [ ] Wired into `pnpm --filter docs build` or documented as a separate `pnpm` script, your choice —
      note the decision in the PR description

## Out of scope

Validating the llms.txt *content*, only that every sidebar page has an entry.
```

#### .agent/docs/specs/2026-11-06-public-presence/issues/richtext-scroll-position.md

```markdown
title: Richtext editor loses scroll position on refresh
labels: help wanted, type: feature, adapter: richtext-plate

## Context

A richtext field's editor box (`PlateEditorField`'s `maxHeight: 500; overflowY: auto` wrapper) always
re-mounts scrolled to the top — a refresh, or the admin form re-mounting, loses your place in a long
document. The design is already approved (see below); this is a "help wanted" because it touches three
packages and a context most contributors haven't worked in yet, not because the shape is undecided.

## Scope

- Key: `vex-richtext-scroll:<collection>:<documentId>:<fieldPath>` in `localStorage`. No key in create
  mode (no document id yet) — nothing persisted.
- An optional `persistenceKey?: string` on core's `VexEditorComponentProps`; a small document-identity
  context provided by `CollectionEditView`/`GlobalEditView` (field inputs don't receive the document id
  today); the richtext `Input` in `@vexcms/react` builds the key and passes it to the editor.
- Save on `onScrollEnd` (`scrollTop > 0` → write, `0` → remove); debounced `scroll` fallback for
  browsers without `onscrollend`.
- Restore once after mount, then re-apply via a `ResizeObserver` until the target offset is reachable,
  the user scrolls, or ~2s pass (content height grows after mount as the editor chunk and images load).

## Acceptance criteria

- [ ] Scrolling a long richtext field and refreshing the page restores the scroll position
- [ ] Switching to create mode (no document id) persists nothing and throws no errors
- [ ] Open question before starting: which document id keys the entry — the first autosave of a
      published document creates a draft row with a different id than the URL's; verify which id a
      refresh actually reopens before implementing, or the saved offset orphans after the first autosave

## Out of scope

Any editor other than the richtext field's Plate.js editor.
```

**Filing and recording.**

```bash
for f in issues/*.md; do
  title=$(sed -n '1s/^title: //p' "$f")
  labels=$(sed -n '2s/^labels: //p' "$f")
  body=$(tail -n +4 "$f")
  echo "$body" > /tmp/issue-body.md
  IFS=',' read -ra L <<< "$labels"
  args=()
  for l in "${L[@]}"; do args+=(--label "$(echo "$l" | xargs)"); done
  gh issue create --repo ianyimi/vex --title "$title" "${args[@]}" --body-file /tmp/issue-body.md
done
```

Run it after step 3's `--prune` sync (labels are a repo setting and apply immediately), so every
`gh issue create --label` call resolves. After each `gh issue create` prints its issue number, fill in
`public-copy.md`'s `### \`planned\` issues` table (one row per `planned`-labeled draft, in the same
order) with `#<number>` for each.

Verify: `gh issue list --repo ianyimi/vex --label planned --json number --jq length` prints `8`.
`gh issue list --repo ianyimi/vex --label "good first issue" --json number --jq length` prints `5`
(the 6th starter issue is `help wanted`, not `good first issue`). Every number from both lists is
recorded in `public-copy.md`. `node scripts/sync-labels.mjs --check` exits 0 — every label used across
`issues/*.md` exists in `labels.yml`.

### Step 8 — FUNDING.yml and the Sponsors profile [dev]

Why: `.github/FUNDING.yml` on `master` renders the repo's Sponsor button; the Sponsors profile itself (bio, featured work, goal) is what a visitor sees after clicking it. By this step the Sponsors application from step 2 has usually cleared review.

- [ ] `.github/FUNDING.yml` created
- [ ] Sponsors profile: bio, featured work and a monthly-amount goal set, with public visibility opted in

#### .github/FUNDING.yml

New file (none exists today — confirmed absent at `.github/FUNDING.yml`). Only the two platforms in scope (Design Decisions 7 and 9); Buttondown has no `FUNDING.yml` key (`sources.md` §2) and carries its link through the footer instead (step 10).

```yaml
github: ianyimi
buy_me_a_coffee: <bmc-user>
```

Replace `<bmc-user>` with the real handle recorded in `public-copy.md` (step 2).

**Sponsors profile (github.com/sponsors/ianyimi, dashboard → Profile).**

1. **Bio** — paste `public-copy.md`'s "GitHub Sponsors" → Bio line verbatim:

   > I build VexCMS, a type-safe headless CMS built on Convex, in my free time. Sponsorship funds the free core: faster bug fixes first, then the free roadmap. Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid.

2. **Featured work** — select `ianyimi/vex` (up to 6 repos may be chosen, `sources.md` §1; one is enough today).
3. **Goal** — pick a monthly-dollar goal (sponsor-count goals are the other type GitHub offers; a dollar goal matches the "funded days a month" framing). Use `public-copy.md`'s goal line, with `<N>` filled in:

   > When this goal is met, VexCMS gets `<N>` funded days a month of free-tier work: bug fixes first, then the next roadmap item.

   Write the chosen `<N>` back into `public-copy.md`'s "GitHub Sponsors" → Goal line (replace the `<N>` placeholder there too) so every surface quoting it agrees.
4. Tick the goal's public-visibility opt-in — money goals default to private and won't show on the public profile otherwise (`sources.md` §1).
5. Confirm all 4 tiers from step 2 show as published on the dashboard.

Verify: on the Sponsors dashboard the goal and all 4 tiers are published; `node -e "require('yaml').parse(require('fs').readFileSync('.github/FUNDING.yml','utf8'))"` parses; after the Release merge the repo header shows "Sponsor" with GitHub Sponsors and Buy Me a Coffee.

### Step 9 — Docs roadmap rewrite [dev]

Why: `apps/docs/src/content/docs/roadmap.md` is the single source of the public roadmap (Design Decision 3). Its current "In progress" bucket goes stale the moment 0.1.0 tags, and its "Enterprise" section names paid features that Design Decision 5 bans from every public surface.

- [ ] `apps/docs/src/content/docs/roadmap.md` rewritten: intro, Shipped in 0.1.0, After 0.1.0 (3 phases), Not planned, paid line
- [ ] `apps/docs/astro.config.mjs`: the `starlightLlmsTxt` `details` roadmap sentence updated to match the new page structure

#### apps/docs/src/content/docs/roadmap.md

Complete replacement. The current page's `## Shipped` bullet list (lines 10–43, already free of "alpha" wording) is kept verbatim under the new heading. The current `## In progress` list had two items: localization folds into "After 0.1.0" phase 2 below (it already reads the same way in `public-copy.md`); the responsive pass ships by the time this spec runs (launch item 14 precedes it), so it's included as a shipped bullet below — drop that bullet if item 14 hasn't landed when this step ships. Keep the accessibility-statement bullet only if `2026-11-06-quality-pass`'s accessibility statement has shipped by then; keep the telemetry bullet only if the unstaged telemetry work (`packages/telemetry`, `packages/create-vexcms`) has been committed and documented by then — drop either bullet otherwise, rather than leaving a note in the page source (AP-024). The old `## Planned`, `## Future`, `## Exploring` and `## Enterprise` sections are replaced outright by "After 0.1.0" (Design Decision 3); `## Enterprise`'s paid items (co-editing, SSO, audit log, approval workflows, content branching) don't appear anywhere on the page.

The 8 `#…` issue placeholders below are filled from the `public-copy.md` table (step 7); keep them in the same order as that table so the two stay easy to diff.

````markdown
---
title: Roadmap
description: What's shipped in VexCMS 0.1.0, what ships next, and what's not planned.
---

VexCMS's free roadmap doesn't stop at 0.1.0. What shipped in VexCMS 0.1.0, what ships next,
and what isn't planned. This page is the source of truth for the roadmap; the
[vexcms.dev roadmap](https://vexcms.dev/roadmap) summarises it.

## Shipped in 0.1.0

- ✅ 16 field types — `text`, `number`, `checkbox`, `select`, `date`, `url`, `email`, `textarea`, `json`, `relationship`, `upload`, `array`, `group`, `blocks`, `color`, `richtext` (Plate.js via `@vexcms/richtext-plate`, with inline images from the media library)
- ✅ Versioning & drafts — draft/publish workflow, autosave, version history, restore, and unpublish
- ✅ Convex schema + type codegen
- ✅ Real-time admin panel
- ✅ DataTable with pagination and `totalDocs`
- ✅ Media library
- ✅ RBAC with document-level access, indexed rules (`withIndex` ranges and `where` predicates), and per-call `access.action` / `access.bypass`
- ✅ Access index resolution — a rule's `withIndex` range and `where` predicate apply inside the Convex query itself
- ✅ `anonRole` fallback for unauthenticated callers
- ✅ Globals (`defineGlobal`)
- ✅ Database-driven theming — `themes` collection, active-theme selector, `buildThemeCss` custom-property injection
- ✅ Better Auth integration
- ✅ Convex file storage
- ✅ TypeDoc API reference
- ✅ CLI — `vex dev` / `vex generate` / `vex deploy`
- ✅ `create-vexcms` scaffolder
- ✅ Field-level RBAC permissions — a filter callback may return a field map instead of a boolean
- ✅ Static prerendering, path-based revalidation, `sitemap.xml` / `robots.txt`
- ✅ Exported React test kit — run the admin panel's own component suite against your config
- ✅ Lifecycle hooks — `beforeChange` / `beforeDelete` (inline, may reject a write) and `afterChange` / `afterDelete` (via `convex-helpers` triggers), wired by default in `create-vexcms`'s `base-nextjs` template and both hand-maintained apps
- ✅ Custom `validate()` — async, server-side, database-aware (uniqueness checks and cross-document rules), enforced on every write. Both are covered in the [lifecycle hooks guide](/guides/lifecycle-hooks/)
- ✅ Live preview — the admin panel streams unsaved form state onto your real route, for collections and globals alike. Preview settings declare per collection/global or in one root `admin.livePreview` map; `url` takes a literal path, a `(doc) => string` resolver, or a `{ server }` resolver that reads the database. Origin-allowlisted and gated per request by a session-verified cookie
- ✅ `email`, `textarea`, and `json` fields — `textarea` adds a character counter, `json` is a CodeMirror editor
- ✅ `tabs`, `collapsible`, `row`, and `ui` layout fields — organize sibling fields into tabs, collapsible sections, and side-by-side rows, or drop in a non-persisted display/action component, all legal anywhere a `fields` record is
- ✅ Conditional fields — `admin.condition({ data, siblingData }) => boolean` shows or hides any field (data or layout), enforced identically on the client and the server
- ✅ Input masks — `admin.mask` on `text` / `email` / `number` / `url`, with project-wide defaults at `fields.inputMasks.<type>`
- ✅ Block clipboard — copy/paste blocks across fields, documents, and collections from a localStorage clipboard validated against the target block definition
- ✅ Admin extension points (experimental) — per-field and project-wide component overrides and additive action-menu contributions, documented in the [admin customization guide](/guides/admin-customization/)
- ✅ List views — per-collection search, sort, an AND/OR filter builder with per-field filter inputs, column visibility/order/pinning/resizing, page size, local and shared saved views (`admin.view` / `admin.views`), a peek panel, row and bulk actions, server-prerendered first paint. See the [list views guide](/guides/list-views/)
- ✅ `commitTs()` field — Convex's own commit timestamp, read-only and auto-indexed; the auto-injected `updatedAt` uses it
- ✅ Edit-view overhaul — reorganized header with a ⋯ actions menu, every built-in action a replaceable `admin.components.edit` slot contribution, an unsaved-changes guard, duplicate for documents and blocks, and collection URLs under `/admin/collections/<slug>`. See the [admin customization guide](/guides/admin-customization/)
- ✅ Field input consistency pass — consistent empty, loading, error, and read-only states across inputs, the relationship field included, and the media picker honours the upload field's `accept` filter
- ✅ Responsive pass across the admin panel and marketing site
- ✅ Accessibility statement — the admin panel and marketing template's accessibility commitments and known gaps, at [/accessibility](/accessibility)
- ✅ Opt-out build-time telemetry — anonymous, aggregate scaffold telemetry collected at `create-vexcms` build time, documented and opt-out in one step. See the [telemetry guide](/guides/telemetry/)

## After 0.1.0

Everything below is free and lands in the Apache-2.0 core. It ships in this order.

1. **Plugin system** — The extension points 0.1.0 ships (admin slots, component overrides, action contributions) become a supported plugin API for collections, fields, hooks, access rules and admin views. [`planned` issue #…](https://github.com/ianyimi/vex/issues/#…)
2. **Free features, as demand appears** — No fixed order: 👍 the linked issue to move one up.
   - **Localization** — Per-field locale values, opted into per collection and per field, with locale-aware drafts. [`planned` issue #…](https://github.com/ianyimi/vex/issues/#…)
   - **Scheduled publishing** — Publish and unpublish at a set time, on Convex's scheduler. [`planned` issue #…](https://github.com/ianyimi/vex/issues/#…)
   - **TanStack Start adapter** — The admin panel and the caching helpers on a second framework. [`planned` issue #…](https://github.com/ianyimi/vex/issues/#…)
   - **Form builder** — Collect input from site visitors, with generated validation and stored submissions. [`planned` issue #…](https://github.com/ianyimi/vex/issues/#…)
   - **Outbound webhooks** — Notify other services when content changes. [`planned` issue #…](https://github.com/ianyimi/vex/issues/#…)
   - **API keys and team management** — Invite people, assign roles, and issue scoped keys for reading content from outside. [`planned` issue #…](https://github.com/ianyimi/vex/issues/#…)
3. **Brownfield adoption** — Add VexCMS to an existing Convex app table by table, without migrating the data it already holds. [`planned` issue #…](https://github.com/ianyimi/vex/issues/#…)

How VexCMS compares today: [Compare](/compare/).

## Not planned

Assessed and deliberately excluded, so you do not have to wonder:

- **`imageUrl` field** — use `upload` with the media library, or a `url` field.

Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid.
````

Each `#…` placeholder becomes the real issue number from `public-copy.md`'s "`planned` issues" table (filled by step 7) — replace all 8 at once, in table order, before merging this step.

The "Exported React test kit" bullet stays listed as shipped here even though Design Decision 5 drops the matching *planned* item from the www roadmap block (step 10) — the decision names that as a www-surface omission specifically because the test kit already shipped, so it belongs on this shipped list and not on a `planned` one.

#### apps/docs/astro.config.mjs

**1 — update the roadmap sentence in `starlightLlmsTxt`'s `details`.** Anchor: the array entry `'- VexCMS ships as \`0.1.0-alpha\`; \`/roadmap\` is authoritative for what exists today versus what is planned.'` inside the `details:` array (the `0.1.0-alpha` wording itself stays — it flips in step 18, once 0.1.0 is on npm):

```javascript
'- VexCMS ships as `0.1.0-alpha`; `/roadmap` lists what shipped in 0.1.0, what ships next (in order), and what is not planned.',
```

Verify: `pnpm --filter docs build`. `rg -n "Enterprise|annual licence|co-editing|SSO|audit log|In progress|alpha" apps/docs/src/content/docs/roadmap.md` returns nothing (the frontmatter `description` and body carry no "alpha" string — `0.1.0` alone is fine). Each of the 8 post-0.1.0 items links its `planned` issue and the link resolves. `rg -o "Paid add-ons may come later.*?nothing free becomes paid\." apps/docs/src/content/docs/roadmap.md` prints exactly that sentence, matching `public-copy.md` byte for byte.

### Step 10 — www and apps/test seed copy: roadmap page, FAQ, footer [dev]

Why: the www roadmap block and FAQ summarise Q (the post-0.1.0 roadmap) and must not name paid work. "Who builds this" and the funding/follow links are R's public surface. Footer links are seed data (P-018), so none of this needs a code change outside `seed.ts` and the two block `config.ts` defaults.

- [ ] `apps/www/convex/seed.ts`: roadmap page (`roadmap-hero`, `roadmap-stats`, `roadmap-roadmap`), home FAQ (`home-faq`), footer (`main-footer`) edited; footer entries inserted at their `public-copy.md` § Footer positions
- [ ] `apps/www/src/vexcms/blocks/Roadmap/config.ts` and `FAQ/config.ts` `defaultValue`s aligned
- [ ] `apps/test/convex/seed.ts` and `apps/test/src/vexcms/blocks/Roadmap/config.ts` mirrored (after the telemetry work in `apps/test` is committed)
- [ ] `.agent/docs/standards/preferences.md`: P-021 amended to name `seed:reinit`
- [ ] `pnpm --filter www exec convex run seed:reinit` on the dev deployment

#### apps/www/convex/seed.ts

**1 — correct the roadmap hero and stats.** Anchor: the `blockType: BLOCK_SLUG_HERO` object with `id: "roadmap-hero"`, and the `blockType: BLOCK_SLUG_STATS` object with `id: "roadmap-stats"` immediately after it (current `heading`: `"What's shipped, what's next, and what's still an idea."`; current `items` first entry `value: "11"`). The stats below are chosen to not depend on a point-in-time spec count.

```typescript
      {
        blockType: BLOCK_SLUG_HERO,
        blockName: "Hero",
        id: "roadmap-hero",
        variant: ["compact"],
        badgeText: "Roadmap",
        heading: "What's shipped, what's next, and what's not planned.",
        subheading:
          "VexCMS is in public alpha, built in the open. This page is edited right here in the admin panel, not in a source file.",
        primaryCtaLabel: "Get started",
        primaryCtaHref: "https://docs.vexcms.dev/guides/quickstart/",
      },
      {
        blockType: BLOCK_SLUG_STATS,
        blockName: "Stats",
        id: "roadmap-stats",
        items: [
          {
            value: "16",
            label: "field types",
            description: "From text and select to blocks, relationships and richtext",
          },
          {
            value: "8",
            label: "packages",
            description: "core, react, next, cli, better-auth, file-storage-convex, richtext-plate, create-vexcms",
          },
          {
            value: "0.1.0-alpha",
            label: "on npm today",
            description:
              "0.1.0 tags when the launch checklist is done. The free roadmap keeps shipping after it",
          },
        ],
      },
```

**2 — replace the `roadmap-roadmap` items array.** Anchor: `id: "roadmap-roadmap"`'s `items: [` array (runs from the `"12 Field Types"` entry through `"Multi-Component Workspaces"`). Shipped items are corrected against the docs roadmap's "Shipped in 0.1.0" list (step 9) — `"12 Field Types"` undercounted by 4 (richtext, json, email, textarea already ship separately below it) and becomes `"16 Field Types"`. Post-0.1.0 items move to `status: ["planned"]` in phase order, with the phase named in each description (Design Decision 4 — phase 2 is unordered and demand-driven, so its items carry identical phase wording rather than an implied order). `"Enterprise Add-Ons"`, `"Multi-Component Workspaces"` and `"S3, R2 & Vercel Blob Adapters"` are dropped (Design Decision 5). `"React Test Kit"` is dropped too — Decision 5 names it specifically as a www-surface omission, even though it stays listed as shipped on the docs roadmap (see the spec conflict noted in step 9). `"Content Scheduling"` and `"Team Management & API Keys"` are renamed to match `public-copy.md`'s phase-2 wording exactly (`"Scheduled publishing"`, `"API keys and team management"`) and gain their new descriptions; `"Outbound Webhooks"`, `"Localization"` and `"Brownfield Adoption"` are new entries, one per `public-copy.md` item not yet represented here.

```typescript
        items: [
          {
            feature: "16 Field Types",
            description:
              "text, number, checkbox, select, date, url, email, textarea, json, relationship, upload, array, group, blocks, color, and richtext.",
            status: ["shipped"],
          },
          {
            feature: "Convex Schema & Type Codegen",
            description:
              "vex dev and vex generate write your Convex schema, TypeScript types, and Zod validators from defineCollection. There is no hand-written schema.ts to drift.",
            status: ["shipped"],
          },
          {
            feature: "Real-Time Admin Panel",
            description:
              "A data table with pagination, live totals, and bulk operations. Every list view is a Convex subscription. Two people on one collection see each other work.",
            status: ["shipped"],
          },
          {
            feature: "Globals",
            description:
              "defineGlobal singletons for site settings, headers, footers, and anything else there is exactly one of.",
            status: ["shipped"],
          },
          {
            feature: "Media Library",
            description:
              "A Convex file storage adapter with a searchable, paginated picker built into every upload field.",
            status: ["shipped"],
          },
          {
            feature: "Document & Field-Level RBAC",
            description:
              "Rules per collection, operation, document, and field. Constraints compile to withIndex ranges inside the query. Per-call overrides and an anonRole fallback are built in.",
            status: ["shipped"],
          },
          {
            feature: "Custom Theme System",
            description:
              "Themes in the database with 32 shadcn tokens per mode, light and dark, stored as OKLCH and applied on first paint. Changing one updates every open tab.",
            status: ["shipped"],
          },
          {
            feature: "Better Auth Integration",
            description:
              "Email, password, and OAuth out of the box, with organisations and API keys available as plugins.",
            status: ["shipped"],
          },
          {
            feature: "SEO, Prerendering & Revalidation",
            description:
              "vexMetadata, vexStaticParams, createVexSitemap, and createVexRobots, plus a revalidate route that purges the cached page when an editor saves.",
            status: ["shipped"],
          },
          {
            feature: "CLI & Scaffolder",
            description:
              "vex dev, vex generate, and create-vexcms. The scaffolder offers a bare project or a full marketing-site template.",
            status: ["shipped"],
          },
          {
            feature: "Data-Table Integrity & Config Honesty",
            description:
              "Every key under admin.view has a consumer. No documented flag does nothing.",
            status: ["shipped"],
          },
          {
            feature: "Public API Honesty Pass",
            description:
              "Nothing exported may lie about what it does. Every documented flag has a consumer, and every consumer is documented.",
            status: ["shipped"],
          },
          {
            feature: "Lifecycle Hooks & Server-Side Validation",
            description:
              "beforeChange and afterChange, plus one write-validation stage. min and max are enforced through the Local API, not only in the admin form. An async validate() receives a ctx typed to your own data model, so transactional uniqueness checks are sound; it throws to reject.",
            status: ["shipped"],
          },
          {
            feature: "Live Preview",
            description:
              "Unsaved form state, streamed onto your real route — the preview is your production page, not a parallel render path. Collections and globals alike, with the preview URL declared centrally or per collection, and resolvable on the server when the path lives in the database. Origin-allowlisted and gated per request.",
            status: ["shipped"],
          },
          {
            feature: "Versioning & Drafts",
            description:
              "A real draft and publish workflow. Reads return the published document, readDrafts returns drafts, and publish promotes. Autosave never touches what is live. Prior versions are restorable from the edit view.",
            status: ["shipped"],
          },
          {
            feature: "Richtext Field",
            description:
              "A richtext() field in core, wired to the Plate.js editor and renderer from @vexcms/richtext-plate, with inline images from the media library.",
            status: ["shipped"],
          },
          {
            feature: "Field Input Consistency Pass",
            description:
              "Every input has correct empty, loading, error, and read-only states, the relationship field included. The media picker honours the upload field's accept filter.",
            status: ["shipped"],
          },
          {
            feature: "Edit-View Overhaul",
            description:
              "An unsaved-changes guard, so a misclick cannot cost you work. Duplicate for documents and for blocks. Every built-in header action is a slot contribution you can hide, reorder, or replace.",
            status: ["shipped"],
          },
          {
            feature: "List-View Overhaul",
            description:
              "Per-collection search, sortable columns, column visibility, page-size control, and saved views. Each control ships together with the config key that drives it.",
            status: ["shipped"],
          },
          {
            feature: "Responsive & Mobile Pass",
            description:
              "Every admin and marketing surface audited at seven widths, from 375 to 1536. No clipped controls, and every primary action reachable on a phone.",
            status: ["shipped"],
          },
          {
            feature: "JSON, Email & Textarea Fields",
            description:
              "Cheap leaf fields: email() with format validation, textarea() with a character counter, and json() backed by a CodeMirror editor.",
            status: ["shipped"],
          },
          {
            feature: "Conditional Fields, Tabs & Layout Fields",
            description:
              "admin.condition({ data, siblingData }) shows or hides any field, enforced identically on client and server. tabs, collapsible, row, and ui organize and extend the edit form, legal anywhere a fields record is.",
            status: ["shipped"],
          },
          {
            feature: "Input Masks & Admin Extension Points",
            description:
              "admin.mask on text/email/number/url with project-wide fields.inputMasks defaults. Experimental per-field and project-wide component overrides, plus block/array action-menu contributions.",
            status: ["shipped"],
          },
          {
            feature: "Block Clipboard",
            description:
              "Copy and paste blocks across fields, documents, and collections from a localStorage clipboard, validated against the target block definition.",
            status: ["shipped"],
          },
          {
            feature: "Plugin System",
            description:
              "After 0.1.0, phase 1: the extension points 0.1.0 ships become a supported plugin API for collections, fields, hooks, access rules and admin views.",
            status: ["planned"],
          },
          {
            feature: "Localization",
            description:
              "After 0.1.0, phase 2 (unordered, demand-driven): per-field locale values, opted into per collection and per field, with locale-aware drafts.",
            status: ["planned"],
          },
          {
            feature: "Scheduled Publishing",
            description:
              "After 0.1.0, phase 2 (unordered, demand-driven): publish and unpublish at a set time, on Convex's scheduler.",
            status: ["planned"],
          },
          {
            feature: "TanStack Start Adapter",
            description:
              "After 0.1.0, phase 2 (unordered, demand-driven): the admin panel and the caching helpers on a second framework.",
            status: ["planned"],
          },
          {
            feature: "Form Builder",
            description:
              "After 0.1.0, phase 2 (unordered, demand-driven): collect input from site visitors, with generated validation and stored submissions.",
            status: ["planned"],
          },
          {
            feature: "Outbound Webhooks",
            description:
              "After 0.1.0, phase 2 (unordered, demand-driven): notify other services when content changes.",
            status: ["planned"],
          },
          {
            feature: "API Keys & Team Management",
            description:
              "After 0.1.0, phase 2 (unordered, demand-driven): invite people, assign roles, and issue scoped keys for reading content from outside.",
            status: ["planned"],
          },
          {
            feature: "Brownfield Adoption",
            description:
              "After 0.1.0, phase 3: add VexCMS to an existing Convex app table by table, without migrating the data it already holds.",
            status: ["planned"],
          },
        ],
```

The `"Public API Honesty Pass"` description above no longer mentions the auto-migration stubs or the localization model — Design Decision 5 omits auto-migration from every public surface, and Design Decision 4 moves localization into "After 0.1.0" phase 2 as its own item, so neither belonged on this one.

**3 — replace the `home-faq` block's "What does it cost?" answer, add "Who builds VexCMS?", and point `supportLink` at Discussions.** Anchor: `id: "home-faq"`'s `supportLink: "https://github.com/ianyimi/vex/issues"` line and the `items` array's `question: "What does it cost?"` entry (last item in the array).

```typescript
        supportLink: "https://github.com/ianyimi/vex/discussions",
```

```typescript
          {
            question: "What does it cost?",
            answer:
              "The core is Apache-2.0 and stays that way: every field type, the admin panel, the CLI, RBAC, drafts, live preview, and hooks. You pay Convex for usage, and Convex has a free tier. Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid.",
          },
          {
            question: "Who builds VexCMS?",
            answer:
              "VexCMS is built and maintained by one developer, @ianyimi, in their free time. New issues are triaged within a week; how fast a fix lands depends on its severity and on sponsorship. Sponsorship pays for time on the free core: faster bug fixes first, then the free roadmap.",
          },
```

**4 — insert Discussions, Release emails, Sponsor, Buy Me a Coffee and the GitHub Sponsors social link at their `public-copy.md` § Footer positions.** Anchor: `id: "main-footer"`'s `links:` array (runs `{ label: "Features", href: "/features" }` through `{ label: "Convex docs", href: "https://docs.convex.dev" }`) and its `socialLinks:` array (`[{ platform: "GitHub", href: "https://github.com/ianyimi/vex", icon: "Github" }]`).

The four `links` go between "Admin demo" (§ Footer #5) and "npm" (#11), in § Footer order (#6–#9). The array below is the result when none of the other specs' entries have landed yet. If "Brand" (step 13, #10), "Privacy" (launch-infra step 13, #13) or "Accessibility" (quality-pass step 11, #14) is already in the seed, it stays where it is; the new entries go in around it, and nothing else moves.

```typescript
        links: [
          { label: "Features", href: "/features" },
          { label: "Roadmap", href: "/roadmap" },
          { label: "Docs", href: "https://docs.vexcms.dev" },
          { label: "Quickstart", href: "https://docs.vexcms.dev/guides/quickstart/" },
          { label: "Admin demo", href: "/admin" },
          { label: "Discussions", href: "https://github.com/ianyimi/vex/discussions" },
          { label: "Release emails", href: "https://buttondown.com/<buttondown-user>" },
          { label: "Sponsor", href: "https://github.com/sponsors/ianyimi" },
          { label: "Buy Me a Coffee", href: "https://buymeacoffee.com/<bmc-user>" },
          { label: "npm", href: "https://www.npmjs.com/package/@vexcms/core" },
          { label: "Licence", href: "https://github.com/ianyimi/vex/blob/master/LICENSE" },
          { label: "Convex", href: "https://convex.dev" },
          { label: "Convex docs", href: "https://docs.convex.dev" },
        ],
        socialLinks: [
          { platform: "GitHub", href: "https://github.com/ianyimi/vex", icon: "Github" },
          { platform: "GitHub Sponsors", href: "https://github.com/sponsors/ianyimi", icon: "Heart" },
        ],
```

Replace `<bmc-user>` and `<buttondown-user>` with the handles recorded in `public-copy.md` (step 2). `icon: "Heart"` resolves through `apps/www/src/vexcms/blocks/Footer/index.tsx`'s `icons[social.icon as keyof typeof icons]` lookup against `lucide-react`'s `icons` export, the same pattern the existing `"Github"` entry already uses — `Heart` is a standard Lucide icon name, so no component change is needed.

#### apps/www/src/vexcms/blocks/Roadmap/config.ts

**1 — drop the "React Package Testing Suite" default item.** Anchor: the `defaultValue:` array's last two entries — `{ feature: "Team Management & API Keys", … status: "planned" }` followed by `{ feature: "React Package Testing Suite", … status: "planned" }`. Design Decision 5 omits it from every public surface, including this block's default content for new instances.

```typescript
        {
          feature: "Team Management & API Keys",
          description: "Invite users, assign roles, and issue scoped read-only API tokens for external integrations.",
          status: "planned",
        },
      ],
```

(Remove the `"React Package Testing Suite"` object and its trailing comma; `"Team Management & API Keys"` becomes the last entry, closing the array as shown.)

#### apps/www/src/vexcms/blocks/FAQ/config.ts

**1 — align the "Is Vex CMS free?" default answer with `public-copy.md`'s paid line.** Anchor: the `defaultValue:` array's `question: "Is Vex CMS free?"` entry.

```typescript
        {
          question: "Is Vex CMS free?",
          answer:
            "Yes. You only pay for your Convex usage, which has a free tier. Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid.",
        },
```

#### apps/test/convex/seed.ts

Run only after the telemetry work in `apps/test` is committed (Design Decision 26). `apps/test`'s anchors carry the same block `id`s and (mostly) the same strings as `apps/www`'s — its FAQ and roadmap block additionally name paid work in places www's current copy doesn't (`"and localization"` tacked onto both the FAQ answer and the `"Enterprise Add-Ons"` description). `apps/test`'s `roadmap-roadmap` array also differs from www's real progress state (its own `"Versioning & Drafts"`, `"Richtext Field"`, `"Data-Table Integrity & Config Honesty"`, `"Public API Honesty Pass"`, `"Edit-View Overhaul"` and `"List-View Overhaul"` entries carry `in-progress` / `planned` statuses, not `shipped` — that reflects `apps/test`'s own build state, not copy, and stays untouched here) — mirror only the copy changes, mode-matched to that app's own progress.

**1 — point `home-faq`'s `supportLink` at Discussions, replace "What does it cost?", and add "Who builds VexCMS?".** Anchor: `id: "home-faq"`'s `supportLink: "https://github.com/ianyimi/vex/issues"` line and the `items` array's last entry, `question: "What does it cost?"`.

```typescript
        supportLink: "https://github.com/ianyimi/vex/discussions",
```

```typescript
          {
            question: "What does it cost?",
            answer:
              "The core is Apache-2.0 and stays that way: every field type, the admin panel, the CLI, RBAC, drafts, live preview, and hooks. You pay Convex for usage, and Convex has a free tier. Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid.",
          },
          {
            question: "Who builds VexCMS?",
            answer:
              "VexCMS is built and maintained by one developer, @ianyimi, in their free time. New issues are triaged within a week; how fast a fix lands depends on its severity and on sponsorship. Sponsorship pays for time on the free core: faster bug fixes first, then the free roadmap.",
          },
```

**2 — drop `"Enterprise Add-Ons"`, `"Multi-Component Workspaces"` and `"S3, R2 & Vercel Blob Adapters"` from `roadmap-roadmap`, and rename the remaining post-0.1.0 items.** Anchors: the `items:` array entries `feature: "Content Scheduling"`, `feature: "Team Management & API Keys"`, `feature: "Enterprise Add-Ons"`, `feature: "Multi-Component Workspaces"` (the array's last two entries). `"React Test Kit"` (status `shipped`) stays — Design Decision 5 drops only the `apps/www/convex/seed.ts` roadmap block's *planned* item (edit 2 above); here it's already `shipped` and correct.

Remove the `"Enterprise Add-Ons"`, `"Multi-Component Workspaces"` and `"S3, R2 & Vercel Blob Adapters"` objects outright. Replace `"Content Scheduling"` and `"Team Management & API Keys"` with:

```typescript
          {
            feature: "Scheduled Publishing",
            description:
              "After 0.1.0, phase 2 (unordered, demand-driven): publish and unpublish at a set time, on Convex's scheduler.",
            status: ["future"],
          },
```

```typescript
          {
            feature: "API Keys & Team Management",
            description:
              "After 0.1.0, phase 2 (unordered, demand-driven): invite people, assign roles, and issue scoped keys for reading content from outside.",
            status: ["future"],
          },
```

(`apps/test`'s post-0.1.0 items keep `status: ["future"]`, not `["planned"]` — `apps/www`'s array uses `"planned"` because those features are confirmed next; `apps/test` is the superset app and lags behind, so its own progress markers for these items stay as they were.) Add the three items `apps/test` is missing, matching `public-copy.md`'s phase list:

```typescript
          {
            feature: "Localization",
            description:
              "After 0.1.0, phase 2 (unordered, demand-driven): per-field locale values, opted into per collection and per field, with locale-aware drafts.",
            status: ["future"],
          },
          {
            feature: "Outbound Webhooks",
            description:
              "After 0.1.0, phase 2 (unordered, demand-driven): notify other services when content changes.",
            status: ["future"],
          },
          {
            feature: "Brownfield Adoption",
            description:
              "After 0.1.0, phase 3: add VexCMS to an existing Convex app table by table, without migrating the data it already holds.",
            status: ["future"],
          },
```

**3 — fix the `"Public API Honesty Pass"` description.** Same spec conflict as `apps/www/convex/seed.ts` (edit 2 above) — `apps/test/convex/seed.ts:1464-1467` carries the identical auto-migration/localization mention.

```typescript
          {
            feature: "Public API Honesty Pass",
            description:
              "Nothing exported may lie about what it does. Every documented flag has a consumer, and every consumer is documented.",
            status: ["planned"],
          },
```

**4 — the same footer insertions as `apps/www/convex/seed.ts` edit 4, at the same § Footer positions.** Anchor: `id: "main-footer"`'s `links:` and `socialLinks:` arrays, identical to `apps/www`'s pre-edit state. If launch-infra step 16 has already ported "Privacy" here, it keeps its place after "Licence".

```typescript
        links: [
          { label: "Features", href: "/features" },
          { label: "Roadmap", href: "/roadmap" },
          { label: "Docs", href: "https://docs.vexcms.dev" },
          { label: "Quickstart", href: "https://docs.vexcms.dev/guides/quickstart/" },
          { label: "Admin demo", href: "/admin" },
          { label: "Discussions", href: "https://github.com/ianyimi/vex/discussions" },
          { label: "Release emails", href: "https://buttondown.com/<buttondown-user>" },
          { label: "Sponsor", href: "https://github.com/sponsors/ianyimi" },
          { label: "Buy Me a Coffee", href: "https://buymeacoffee.com/<bmc-user>" },
          { label: "npm", href: "https://www.npmjs.com/package/@vexcms/core" },
          { label: "Licence", href: "https://github.com/ianyimi/vex/blob/master/LICENSE" },
          { label: "Convex", href: "https://convex.dev" },
          { label: "Convex docs", href: "https://docs.convex.dev" },
        ],
        socialLinks: [
          { platform: "GitHub", href: "https://github.com/ianyimi/vex", icon: "Github" },
          { platform: "GitHub Sponsors", href: "https://github.com/sponsors/ianyimi", icon: "Heart" },
        ],
```

#### apps/test/src/vexcms/blocks/Roadmap/config.ts

**1 — drop the "React Package Testing Suite" default item.** Anchor: the `defaultValue:` array's last two entries — `{ feature: "Team Management & API Keys", … status: "planned" }` followed by `{ feature: "React Package Testing Suite", … status: "planned" }`, identical in shape to `apps/www`'s copy of this file.

```typescript
        {
          feature: "Team Management & API Keys",
          description: "Invite users, assign roles, and issue scoped read-only API tokens for external integrations.",
          status: "planned",
        },
      ],
```

`apps/test/src/vexcms/blocks/FAQ/config.ts` is byte-identical to `apps/www`'s pre-edit version — apply `apps/www/src/vexcms/blocks/FAQ/config.ts`'s edit 1 here unchanged.

#### .agent/docs/standards/preferences.md

1 edit. Everything else in the file is unchanged.

**1 — P-021 names `seed:reinit`.** Anchor: the `- P-021 (2026-09-02)` entry. Replace its first sentence's shipping method and the wipe guidance with the patch-mode re-seed (cross-spec decision 9). The `themes` caveat stays: `reinit` patches by natural id, so it never orphans a theme id, but a manual wipe still would.

```markdown
- P-021 (2026-09-02, amended 2026-11-07) `convex/seed.ts` is the single source of truth for site content, and a content change ships by editing seed then **running `seed:reinit`** (`pnpm --filter <app> exec convex run seed:reinit`, add `--prod` for production) — not by hand-editing documents in the admin panel. `reinit` runs the seed in patch mode: every seeded document is located by its natural id (page `slug`, footer/header `name`, theme name, the `siteSettings` singleton) and patched in place. `init` is insert-only-if-absent, so re-running it after a seed edit silently keeps the old row and the deployment drifts behind the file (measured: `apps/www`'s dev `headers`/`footers` rows still rendered `/docs` links that `seed.ts` had already corrected). Don't wipe rows to force an `init` re-insert: it opens a window with missing content, and wiping `themes` without `siteSettings` leaves `siteSettings.activeTheme`/`adminTheme` pointing at deleted ids. A document published from the admin on a schedule (a launch post) gets its seed `vex_status` changed the same day, so a later `reinit` doesn't un-publish it.
```

Verify: `rg -n "seed:reinit" .agent/docs/standards/preferences.md` hits the P-021 line; `rg -n "wiping the affected rows" .agent/docs/standards/preferences.md` prints nothing; `harness doctor` stays within the preferences budget.

**Re-seed (P-021 as amended).** Run against the `apps/www` dev deployment once the edits above land:

```bash
pnpm --filter www exec convex run seed:reinit
```

`reinit` runs `runSeed(ctx, "patch")`: every document in this step is located by its natural id (footer `name: "Main Footer"`, pages by `slug`) and patched in place. On an empty deployment, `seed:init` once first (`apps/www/package.json`'s `seed` script).

Verify: `pnpm --filter www typecheck && pnpm --filter www test`. `rg -n "Enterprise Add-Ons|annual licence|co-editing|Multi-Component" apps/www/convex/seed.ts apps/test/convex/seed.ts apps/www/src/vexcms/blocks` returns nothing. After `seed:reinit`, `/roadmap` and `/` render the new copy on the running www (port 3030, P-024), and the footer shows the entries present so far in § Footer order.

### Step 11 — Docs header links and the slim README [dev]

Why: R's links belong on the docs header, and T's landing README. The README's 300-line feature reference duplicates the docs guides and goes stale with them; this step turns it into the pitch plus links.

- [ ] `apps/docs/astro.config.mjs` `social`: `heart` and `email` entries added
- [ ] `README.md` rewritten

#### apps/docs/astro.config.mjs

**1 — add Sponsors and Release-emails entries to `social`.** Anchor: `social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/ianyimi/vex' }],`. Both icons are in Starlight's built-in set (`sources.md` §6).

```javascript
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/ianyimi/vex' },
				{ icon: 'heart', label: 'Sponsors', href: 'https://github.com/sponsors/ianyimi' },
				{ icon: 'email', label: 'Release emails', href: 'https://buttondown.com/<buttondown-user>' },
			],
```

Replace `<buttondown-user>` with the handle recorded in `public-copy.md` (step 2).

#### README.md

Complete replacement. Keeps the `preview.png` hero until step 16 swaps in the looping GIF, and a condensed quick start with a docs link until step 17 swaps in N's three commands. Neither swap is noted inside the file (AP-024). The 300-line `## Features` walkthrough is cut (feature table, blocks, globals, media, access control, pagination, admin panel, architecture, tech stack), and `## Docs` links the same ground on the docs site instead.

````markdown
# VexCMS

> [!WARNING]
> VexCMS is pre-release software, published only under the `alpha` npm dist-tag
> (`0.1.0-alpha.x`) — the `latest` tag on npm still points at an old, unrelated
> `0.0.20` line, so installs must use an explicit tag: `pnpm create vexcms@alpha`.
> Use it for experiments and evaluation only; do not put it behind production
> traffic or real user data. Breaking changes land between alpha releases without
> deprecation cycles, and there is no migration path between alphas. See the
> [roadmap](https://docs.vexcms.dev/roadmap/) for what is and is not shipped.

[![npm version](https://img.shields.io/npm/v/@vexcms/core)](https://www.npmjs.com/package/@vexcms/core)
[![CI](https://github.com/ianyimi/vex/actions/workflows/ci.yml/badge.svg)](https://github.com/ianyimi/vex/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/ianyimi/vex)](https://github.com/ianyimi/vex/blob/master/LICENSE)
[![Sponsors](https://img.shields.io/github/sponsors/ianyimi)](https://github.com/sponsors/ianyimi)

<p align="center">
  <img src=".github/assets/preview.png" alt="The VexCMS admin panel editing a Roadmap page: a title, a slug, and an ordered Content field of Hero, Stats, and Roadmap blocks, with the collections and globals sidebar on the right." width="100%">
</p>

A type-safe headless CMS built natively on [Convex](https://convex.dev). VexCMS generates your
Convex schema and typed query/mutation API from a single config file, with a self-hosted
Next.js admin panel for editing content.

## Quick Start

```bash
pnpm create vexcms@alpha my-site
cd my-site
npx convex dev
```

`npx convex dev` links or creates your Convex deployment and prints the real
`NEXT_PUBLIC_CONVEX_URL`/`NEXT_PUBLIC_CONVEX_SITE_URL` — paste them into `.env.local`. See the
[quickstart guide](https://docs.vexcms.dev/guides/quickstart/) for the Better Auth environment
variables, `pnpm dev`, and signing in as the first (auto-promoted) admin.

## Why VexCMS?

- **Convex-native**: your VexCMS config generates the Convex schema — no translation layer, no separate ORM.
- **Full type safety**: fields, relationships, access permissions, and the generated document/query types are all type-checked end to end.
- **Real-time by default**: Convex's reactive subscriptions power live updates across the admin panel and your frontend.
- **PayloadCMS-familiar DX**: if you know Payload, the collection/field/access shape will feel familiar — different runtime, similar authoring model.
- **Self-hosted**: you own your data, your Convex deployment, and your admin panel.

## Docs

The full field reference, guides (auth, access control, caching, theming, adapters, lifecycle
hooks, admin customization, list views), and the generated API reference live at
[docs.vexcms.dev](https://docs.vexcms.dev). The docs site also serves
[llms.txt](https://llmstxt.org) indexes for AI coding agents — point your agent at `/llms.txt`
(index), `/llms-full.txt` (complete docs), or `/llms-small.txt` (compact).

## Roadmap

Next comes a plugin system, then free features as demand appears — localization, scheduled
publishing, a TanStack Start adapter, a form builder, outbound webhooks, API keys and team
management — then brownfield adoption. All of it is free, in the Apache-2.0 core. See the
full [roadmap](https://docs.vexcms.dev/roadmap/).

## Compare

[VexCMS vs Payload, Sanity and Strapi](https://docs.vexcms.dev/compare/).

## Community

- **Questions and ideas**: [GitHub Discussions](https://github.com/ianyimi/vex/discussions)
- **Bugs**: [issues](https://github.com/ianyimi/vex/issues/new/choose)
- **Release emails**: [subscribe](https://buttondown.com/<buttondown-user>)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Security**: [SECURITY.md](SECURITY.md) — private vulnerability reporting, or security@vexcms.dev

## Who builds this

VexCMS is built and maintained by one developer, [@ianyimi](https://github.com/ianyimi), in
their free time. New issues are triaged within a week; how fast a fix lands depends on its
severity and on sponsorship.

## Sponsors

Sponsorship pays for time on the free core: faster bug fixes first, then the free roadmap.
Sponsor on [GitHub Sponsors](https://github.com/sponsors/ianyimi) (monthly or one-time), or
[buy me a coffee](https://buymeacoffee.com/<bmc-user>).

No sponsors yet — be the first.

## License

VexCMS is Apache-2.0 licensed. Paid add-ons may come later, as separate packages, after the
free roadmap. The core stays Apache-2.0, and nothing free becomes paid.
````

Replace `<bmc-user>` with the handle recorded in `public-copy.md` (step 2).

Verify: `pnpm --filter docs build`; the docs header shows GitHub, Sponsor and Release emails icons with accessible labels (Starlight renders each `social` entry's `label` as the link's accessible name). The README renders on GitHub (preview the branch) with all 4 badges resolving. `rg -n "co-editing|SSO|audit logs|annual licence" README.md` returns nothing.

### Step 12 — Comparison page [dev]

The docs site gets a `/compare` page answering "why not Payload/Sanity/Strapi?" with one dated, sourced table covering free-tier capabilities only — no SSO, audit-log or co-editing rows (Design Decision 20). Vex's column is verified against the shipped list in `apps/docs/src/content/docs/roadmap.md` and the guides; every competitor cell carries its source URL and a per-competitor check date that must sit within 7 days of the day this page ships, re-checked against `competitors.md` at publish time.

- [ ] `apps/docs/src/content/docs/compare.mdx` created: intro, free-tier capability table (Vex + Payload + Sanity + Strapi, one check date per competitor column), "When to pick something else", sources
- [ ] `apps/docs/astro.config.mjs` sidebar: a `compare` entry after Roadmap

#### apps/docs/src/content/docs/compare.mdx

````markdown
---
title: Compare VexCMS
description: How VexCMS's free tier compares to Payload, Sanity, and Strapi on content modeling, types, database, hosting, licence, and the admin panel.
---

This page compares what each product gives you without paying for a plan. Each competitor column
carries the date it was checked; if a date looks stale, check the vendor's docs — feature sets
move fast.

Paid add-ons may come later, as separate packages, after the free roadmap. The core stays
Apache-2.0, and nothing free becomes paid.

## Free-tier capability table

| Capability | VexCMS | Payload <sup>[checked 2026-11-06]</sup> | Sanity <sup>[checked 2026-11-06]</sup> | Strapi <sup>[checked 2026-11-06]</sup> |
|---|---|---|---|---|
| Content model | Code: `defineCollection()`/`defineGlobal()` in TypeScript, no UI schema builder[^1] | Code: TypeScript `payload.config.ts`[^p1] | Code: JS/TS `defineType`/`defineField`[^s1] | Both: UI Content-type Builder generates `schema.json`, also hand-editable in code[^st1] |
| Generated types | `vex dev`/`vex generate` write the Convex schema, Zod validators, and TypeScript types from the same config — no separate CLI step[^2] | `payload generate:types` CLI → `payload-types.ts` + generic helpers[^p2] | `sanity typegen generate` → `sanity.types.ts` (schema + GROQ query types)[^s2] | `ts:generate-types` CLI command[^st2] |
| Database | Convex only — no adapter, no choice[^3] | Bring-your-own: MongoDB, Postgres, or SQLite via adapter[^p3] | Proprietary hosted Content Lake, not self-hostable[^s3] | Bring-your-own SQL: Postgres, MySQL, MariaDB (SQLite for dev)[^st3] |
| What you run in production | A Convex deployment (managed by Convex) plus your Next.js app — no database to provision yourself[^4] | A self-managed Node.js/Next.js server plus a database you provision and operate (MongoDB, Postgres, or SQLite)[^p4] | No server of your own: Studio is a static app you can host anywhere, but Content Lake requires an active (free or paid) Sanity account[^s4] | Either a self-managed Node.js server plus a SQL database, or Strapi Cloud (from $35/project/month)[^st4] |
| Licence | Apache-2.0, the entire project[^5] | MIT, the entire core (admin panel included)[^p5] | Studio: MIT (confirmed via `gh api repos/sanity-io/sanity/license`). Content Lake: proprietary SaaS[^s5] | MIT core; code under `ee/` directories is proprietary Strapi Enterprise Edition[^st5] |
| Pricing model | Free and open source; no SaaS tier[^6] | No SaaS pricing page; self-hosted OSS, Enterprise is sales-contact[^p6] | Free tier (20 seats, 2 datasets, 10k docs), paid from $15/seat/month (Growth)[^s6] | Community free/unlimited (MIT); paid CMS from $45/month (Growth), Cloud hosting from $35/project/month[^st6] |
| Real-time admin | Every list view is a Convex subscription — two editors on one collection see each other's writes live[^7] | "Multi-Player Editing" listed Coming Soon under Enterprise, not shipped[^p7] | Real-time editing and multiplayer presence, on all plans including Free[^s7] | No real-time/presence feature found; an open, unimplemented feedback request exists for basic edit-locking[^st7] |
| Live preview of unsaved edits | Streams the form's current (unsaved) values onto the real public route via `postMessage` + `BroadcastChannel`, no draft save required[^8] | Core OSS Live Preview (iframe, `postMessage`, real-time); the separate drag-and-drop "Visual Editor" is Coming Soon under Enterprise[^p8] | Live Preview and Visual Editing (click-to-edit Presentation tool), on all plans including Free[^s8] | Not on Community (free); available on Growth ($45/month) and Enterprise[^st8] |
| Drafts + version history | One published row plus at most one draft row sharing its `_id`; every distinct content state recorded as an immutable `vex_versions` snapshot; restore and unpublish included[^9] | Core OSS Versions/Drafts system with version history[^p9] | Review Changes retention: 3 days (Free), 90 days (Growth), 365 days (Enterprise)[^s9] | Draft & Publish is core/free; Content History (version history UI) is Growth (14 days) or Enterprise (custom), not on Community[^st9] |
| Scheduled publishing | After 0.1.0 (roadmap) | Core OSS — `versions.drafts.schedulePublish` on the base Versions config[^p10] | Growth plan ($15/seat/month) and up, not on Free[^s10] | "Releases" feature — not on Community, unlimited on Growth and Enterprise[^st10] |
| Localization | After 0.1.0 (roadmap) | Core OSS, unlimited locales, field-level, with fallback and RTL[^p11] | Unlimited locales on all plans, no extra charge[^s11] | i18n plugin, free, 500+ preset locales, all plans (disabled by default)[^st11] |
| Access control (document/field level, applied in the query) | `defineAccess()`: role → subject → check, enforced on the server; a `withIndex`/`where` check compiles directly into the Convex query itself, not a post-filter[^12] | Function-based access control (not fixed roles), Collection/Global/Field level, core OSS[^p12] | Fixed roles (2 on Free, 5 on Growth); custom roles and GROQ-filtered resources are Enterprise-only[^s12] | RBAC free/core: custom admin roles plus field/locale-level permission conditions[^st12] |
| Hooks + server validation | `beforeChange`/`beforeDelete`/`afterChange`/`afterDelete` collection hooks, plus an async server-only field `validate()` that runs after the generated Zod schema and can read the database[^13] | Core OSS Collection/Global/Field hooks (`beforeChange`, `afterChange`, etc.)[^p13] | GROQ-powered webhooks plus serverless Functions, included on Free and Growth[^s13] | Lifecycle hooks (model-level) plus webhooks, selectable per entry event[^st13] |
| Rich text | Plate.js, via `@vexcms/richtext-plate`, with inline images from the media library[^14] | Lexical, via `@payloadcms/richtext-lexical`[^p14] | Portable Text (structured JSON format)[^s14] | Legacy Markdown editor, or a block-based Blocks editor[^st14] |
| Blocks/page building | `blocks()` field: ordered, typed arrays of named block shapes, with cross-document/cross-collection clipboard copy/paste[^15] | Core OSS "Blocks" field type[^p15] | Presentation tool/page-building, on all plans[^s15] | Dynamic Zones (ordered zones of reusable Components)[^st15] |
| Media storage | Convex file storage ships as the default adapter; other backends plug in through the storage-adapter interface[^16] | Local disk by default, `disableLocalStorage` for CDN offload via official `@payloadcms/storage-*` adapters (S3, R2, Vercel Blob, Azure, GCS)[^p16] | Built-in asset pipeline (resize/crop/hotspot, CDN-delivered); 100GB on Free/Growth[^s16] | Media Library: Local by default, official S3 and Cloudinary providers, extensible for others[^st16] |
| Admin extension | Experimental: per-field/per-type component overrides, plus additive action-menu contributions on `blocks()`/`array()` fields — the built-in UI is registered through the same mechanism[^17] | React component swapping via `admin.components.*`, plus Custom Views[^p17] | `studio.components`/`form.components`, middleware/`renderDefault` composition, `definePlugin`[^s17] | Plugin system plus admin-customization/extension APIs[^st17] |
| Frameworks | Next.js (via `@vexcms/next`); a second framework (TanStack Start) is after 0.1.0 (roadmap) | Runs inside a Next.js app — admin panel is itself a generated Next.js app[^p19] | Frontend-agnostic: Studio deploys separately, content fetched via API/SDKs into any frontend[^s19] | Frontend-agnostic headless API, promoted alongside Next.js/Vercel deployment[^st19] |
| APIs | Local API only: typed `get`/`find`/`search`/`create`/`update`/`remove`/`globals` functions called directly inside your own Convex functions — no separate REST/GraphQL hop[^18] | REST, GraphQL, and a Local API (in-process, no network hop), all generated from the same config[^p20] | GROQ (primary, with Vision playground and typegen) plus GraphQL (CLI-deployed) plus a Live Content API[^s20] | REST API (auto-generated CRUD per content-type) plus GraphQL API, both free[^st20] |
| List views (search/filters/saved views) | Per-collection search, an AND/OR filter builder, column visibility/order/pinning/resizing, page size, and local + shared saved views (`admin.view`/`admin.views`), server-prerendered[^20] | Core "Query Presets" — save/share filters, columns, and sort orders for the List View, no plan-gating language found[^p21] | Structure Builder's Document List is live-updated and GROQ-filter-based, but filtering/grouping is developer-defined in code, not a saveable per-user UI filter[^s21] | Search plus combinable Filters, configurable per content-type by an admin; no per-user saved-views feature found[^st21] |

## When to pick something else

- **You need a database other than Convex.** VexCMS has no adapter layer — it runs on Convex only. Payload or Strapi let you bring MongoDB, Postgres, or MySQL.
- **You need REST or GraphQL out of the box.** VexCMS exposes a typed Local API you call from your own Convex functions; it has no separate HTTP API surface. Payload, Sanity, and Strapi all ship a queryable HTTP API today.
- **You need localization today.** It's on VexCMS's post-0.1.0 roadmap, not shipped. Payload, Sanity, and Strapi all ship it free, now.
- **Your editors need to model content in a UI**, not read/review TypeScript. Strapi's Content-type Builder lets a non-developer define content types from the admin panel; VexCMS's model is code-only.
- **You want a vendor-hosted SaaS**, with no server of your own to run. Sanity's Content Lake is hosted for you. VexCMS, Payload, and self-hosted Strapi all require you to run something yourself (for VexCMS, that's a Convex deployment plus your Next.js app).
- **You need a mature plugin ecosystem.** Payload, Sanity, and Strapi each have years of community plugins and a form-builder plugin already available (Payload's is official: `@payloadcms/plugin-form-builder`). VexCMS's plugin system doesn't exist yet — it's the first item on the post-0.1.0 roadmap, and until then an extension point only covers admin component overrides and action contributions.
- **You need a long-stable API.** VexCMS is at 0.1 — the config shape and the Local API can still change between minor versions. Payload (v3), Sanity (Studio v6) and Strapi (v5) are well past their first stable major.

## Sources

Fetched 2026-11-06. Re-checked and re-dated against `competitors.md` within 7 days of this page's
publish date.

[^1]: VexCMS docs — [Quickstart](/guides/quickstart/), [Access Control](/guides/access-control/)
[^2]: VexCMS docs — [Roadmap](/roadmap/) ("Convex schema + type codegen")
[^3]: VexCMS docs — [index](/)
[^4]: VexCMS docs — [Quickstart](/guides/quickstart/)
[^5]: `LICENSE` (Apache-2.0), repo root
[^6]: `README.md` License section
[^7]: VexCMS docs — [Roadmap](/roadmap/) ("Real-time admin panel")
[^8]: VexCMS docs — [Live Preview](/guides/live-preview/)
[^9]: VexCMS docs — [Versioning & Drafts](/guides/versioning-and-drafts/)
[^12]: VexCMS docs — [Access Control (RBAC)](/guides/access-control/)
[^13]: VexCMS docs — [Lifecycle hooks](/guides/lifecycle-hooks/)
[^14]: VexCMS docs — [Roadmap](/roadmap/) (Plate.js via `@vexcms/richtext-plate`)
[^15]: VexCMS docs — [`blocks` field](/fields/blocks/)
[^16]: VexCMS docs — [Custom storage adapter](/guides/custom-storage-adapter/)
[^17]: VexCMS docs — [Admin Customization](/guides/admin-customization/)
[^18]: VexCMS docs — [Local API](/guides/local-api/)
[^20]: VexCMS docs — [List views](/guides/list-views/)

[^p1]: https://payloadcms.com/docs/getting-started/what-is-payload (fetched 2026-11-06)
[^p2]: https://payloadcms.com/docs/typescript/overview (fetched 2026-11-06)
[^p3]: https://payloadcms.com/docs/database/overview (fetched 2026-11-06)
[^p4]: https://payloadcms.com/docs/getting-started/what-is-payload ; https://payloadcms.com/docs/database/overview (fetched 2026-11-06)
[^p5]: https://raw.githubusercontent.com/payloadcms/payload/main/LICENSE.md (fetched 2026-11-06)
[^p6]: https://payloadcms.com/pricing (404, attempted 2026-11-06); https://payloadcms.com/enterprise (fetched 2026-11-06)
[^p7]: https://payloadcms.com/enterprise (fetched 2026-11-06)
[^p8]: https://payloadcms.com/docs/live-preview/overview (fetched 2026-11-06)
[^p9]: https://payloadcms.com/docs/versions/overview (fetched 2026-11-06)
[^p10]: https://payloadcms.com/docs/versions/overview (fetched 2026-11-06)
[^p11]: https://payloadcms.com/docs/configuration/localization (fetched 2026-11-06)
[^p12]: https://payloadcms.com/docs/access-control/overview (fetched 2026-11-06)
[^p13]: https://payloadcms.com/docs/typescript/overview (fetched 2026-11-06)
[^p14]: https://payloadcms.com/docs/rich-text/overview (fetched 2026-11-06)
[^p15]: https://payloadcms.com/docs/configuration/localization (fetched 2026-11-06)
[^p16]: https://payloadcms.com/docs/upload/storage-adapters (fetched 2026-11-06)
[^p17]: https://payloadcms.com/docs/upload/overview (fetched 2026-11-06)
[^p19]: https://payloadcms.com/docs/getting-started/what-is-payload (fetched 2026-11-06)
[^p20]: https://payloadcms.com/docs/getting-started/what-is-payload ; https://payloadcms.com/docs/local-api/overview (fetched 2026-11-06)
[^p21]: https://payloadcms.com/docs/query-presets/overview (fetched 2026-11-06)

[^s1]: https://www.sanity.io/docs/studio (fetched 2026-11-06)
[^s2]: https://www.sanity.io/docs/apis-and-sdks/sanity-typegen (fetched 2026-11-06)
[^s3]: https://www.sanity.io/docs/studio ; https://www.sanity.io/pricing (fetched 2026-11-06)
[^s4]: https://www.sanity.io/docs/studio ; https://www.sanity.io/pricing (fetched 2026-11-06)
[^s5]: `gh api repos/sanity-io/sanity/license` (fetched 2026-11-06)
[^s6]: https://www.sanity.io/pricing (fetched 2026-11-06)
[^s7]: https://www.sanity.io/pricing (fetched 2026-11-06)
[^s8]: https://www.sanity.io/pricing (fetched 2026-11-06)
[^s9]: https://www.sanity.io/pricing (fetched 2026-11-06)
[^s10]: https://www.sanity.io/blog/scheduled-drafts ; https://www.sanity.io/pricing (fetched 2026-11-06)
[^s11]: https://www.sanity.io/pricing (fetched 2026-11-06)
[^s12]: https://www.sanity.io/docs/user-guides/roles ; https://www.sanity.io/pricing (fetched 2026-11-06)
[^s13]: https://www.sanity.io/pricing (fetched 2026-11-06)
[^s14]: https://www.sanity.io/docs/studio (fetched 2026-11-06)
[^s15]: https://www.sanity.io/pricing (fetched 2026-11-06)
[^s16]: https://www.sanity.io/pricing (fetched 2026-11-06)
[^s17]: https://www.sanity.io/docs/studio/intro-to-custom-studio-components (fetched 2026-11-06)
[^s19]: https://www.sanity.io/docs/apis-and-sdks/sanity-typegen (fetched 2026-11-06)
[^s20]: https://www.sanity.io/docs/content-lake/graphql ; https://www.sanity.io/docs/apis-and-sdks/sanity-typegen (fetched 2026-11-06)
[^s21]: https://www.sanity.io/docs/studio/structure-builder-introduction (fetched 2026-11-06)

[^st1]: https://docs.strapi.io/cms/backend-customization/models (fetched 2026-11-06)
[^st2]: https://docs.strapi.io/cms/backend-customization/models (fetched 2026-11-06)
[^st3]: https://strapi.io/pricing-cms (fetched 2026-11-06)
[^st4]: https://strapi.io/pricing-cms ; https://strapi.io/pricing-cloud (fetched 2026-11-06)
[^st5]: https://raw.githubusercontent.com/strapi/strapi/main/LICENSE (fetched 2026-11-06)
[^st6]: https://strapi.io/pricing-cms ; https://strapi.io/pricing-cloud (fetched 2026-11-06)
[^st7]: https://feedback.strapi.io/customization/p/content-editor-lock (fetched 2026-11-06)
[^st8]: https://docs.strapi.io/cms/features/preview ; https://strapi.io/pricing-cms (fetched 2026-11-06)
[^st9]: https://strapi.io/pricing-cms ; https://docs.strapi.io/cms/features/content-manager (fetched 2026-11-06)
[^st10]: https://strapi.io/pricing-cms (fetched 2026-11-06)
[^st11]: https://docs.strapi.io/cms/features/internationalization (fetched 2026-11-06)
[^st12]: https://docs.strapi.io/cms/features/rbac (fetched 2026-11-06)
[^st13]: https://docs.strapi.io/cms/backend-customization/models ; https://github.com/strapi/strapi/releases (fetched 2026-11-06)
[^st14]: https://docs.strapi.io/cms/features/content-manager (fetched 2026-11-06)
[^st15]: https://docs.strapi.io/cms/backend-customization/models ; https://strapi.io/pricing-cms (fetched 2026-11-06)
[^st16]: https://docs.strapi.io/cms/features/media-library (fetched 2026-11-06)
[^st17]: https://docs.strapi.io/cms/features/rbac (fetched 2026-11-06)
[^st19]: https://strapi.io/pricing-cloud (fetched 2026-11-06)
[^st20]: https://docs.strapi.io/cms/api/rest ; https://strapi.io/pricing-cms (fetched 2026-11-06)
[^st21]: https://docs.strapi.io/cms/features/content-manager (fetched 2026-11-06)
````

Verify: `pnpm --filter docs build`. `rg -n "SSO|audit|co-edit" apps/docs/src/content/docs/compare.mdx` returns nothing. Every competitor cell's footnote resolves to a URL carrying "fetched 2026-11-06"; re-run the fetch against `competitors.md` and bump every date below 7 days old before the page ships.

#### apps/docs/astro.config.mjs

1 edit. Everything else in the file is unchanged.

**1 — add `compare` to the `sidebar` array, right after the `Roadmap` entry.** The existing sidebar reads:

```js
sidebar: [
	{ label: 'Introduction', slug: 'index' },
	{ label: 'Roadmap', slug: 'roadmap' },
	{
		label: 'Next.js',
```

Insert a `Compare` entry between the `Roadmap` line and the `Next.js` group:

```js
sidebar: [
	{ label: 'Introduction', slug: 'index' },
	{ label: 'Roadmap', slug: 'roadmap' },
	{ label: 'Compare', slug: 'compare' },
	{
		label: 'Next.js',
```

Verify: `pnpm --filter docs build`; the page renders in the sidebar directly after Roadmap.

### Step 13 — Brand kit: logos, `/brand` page, footer link [dev]

The brand kit gives U's posts, Product Hunt, and the social card a fixed set of logo files at stable public URLs. It lives on www as a seeded page (Design Decision 22) because Next serves no index for a public folder, and `/brand`'s links are the CTA actions on a Hero-compact + CTA page, built the same way every other www page is (P-018).

- [ ] `apps/www/public/brand/`: `vexcms-logo-light.svg`, `vexcms-logo-dark.svg`, `vexcms-mark.svg`, 1024px PNG exports of each (`vexcms-logo-light.png`, `vexcms-logo-dark.png`, `vexcms-mark.png`), and `vexcms-mark-240.png` (240×240, Product Hunt's logo size) — 7 files
- [ ] `apps/www/convex/seed.ts`: a `brand` page (Hero compact + CTA actions, one per file) and the footer "Brand" link at its `public-copy.md` § Footer position
- [ ] `apps/test/convex/seed.ts`: the same page and footer-link edit, run only after the telemetry work in `apps/test` is committed
- [ ] `apps/www/e2e/routes.ts`: `{ path: "/brand" }` in `QUALITY_ROUTES`, if that file exists

#### apps/www/public/brand/

Seven static files, none of them code:

| File | Size | Content |
|---|---|---|
| `vexcms-logo-light.svg` | vector | Wordmark + mark for light backgrounds — the `BrandMark` chevron (`apps/www/src/components/BrandMark.tsx`, the `M2.5 3.25 7.25 12.75…` path) next to the "VexCMS" wordmark, both in dark ink |
| `vexcms-logo-dark.svg` | vector | Same composition, inverted for dark backgrounds |
| `vexcms-mark.svg` | vector | The chevron alone, no wordmark — same path data as `BrandMark.tsx` |
| `vexcms-logo-light.png` | 1024px wide | Rasterized export of `vexcms-logo-light.svg` |
| `vexcms-logo-dark.png` | 1024px wide | Rasterized export of `vexcms-logo-dark.svg` |
| `vexcms-mark.png` | 1024×1024 | Rasterized export of `vexcms-mark.svg` |
| `vexcms-mark-240.png` | 240×240 | Rasterized export of `vexcms-mark.svg` for the Product Hunt listing (launch-kit step 10 uploads it) |

The wordmark and the mark both derive from `apps/www/src/components/BrandMark.tsx`: it's the only
place the chevron geometry is defined in the codebase (the header and footer render `<BrandMark>`
directly, with "VexCMS" as adjacent text — there is no separate logo asset in the component tree
today). Export the SVGs from that path data at a fixed size rather than hand-redrawing it, so the
brand kit and the live UI never drift.

Verify: every file in this directory is referenced by a CTA action below, and every link 200s
once seeded (`curl -sI http://localhost:3030/brand/<file>`).

#### apps/www/convex/seed.ts

2 edits. Everything else in the file is unchanged.

**1 — new `brand` page, following the existing `existingFeatures`/`featuresPageDoc` pattern beside `existingRoadmapPage`.** Add after the `page:roadmap` insert/patch block (the one closing `} else { … created.push("page:roadmap") }`), mirroring the roadmap page's own locator exactly:

```ts
  const existingBrandPage = await ctx.db
    .query(TABLE_SLUG_PAGES)
    .withIndex("by_slug", (q) => q.eq("slug", "brand"))
    .filter((q) => q.neq(q.field("vex_status"), "draft"))
    .first()
  const brandPageDoc: WithoutSystemFields<Doc<typeof TABLE_SLUG_PAGES>> = {
    title: "Brand",
    slug: "brand",
    vex_status: "published",
    blocks: [
      {
        blockType: BLOCK_SLUG_HERO,
        blockName: "Hero",
        id: "brand-hero",
        variant: ["compact"],
        badgeText: "Brand",
        heading: "Logos, wordmark, and brand assets.",
        subheading:
          "The VexCMS wordmark and mark, in light and dark, plus 1024px PNG exports. Use them unmodified — don't recolor, stretch, or add effects.",
      },
      {
        blockType: BLOCK_SLUG_CTA,
        blockName: "Call to Action",
        id: "brand-downloads",
        heading: "Download",
        subheading: "SVG for print and the web, PNG for everything else.",
        actions: [
          { label: "Logo (light), SVG", href: "/brand/vexcms-logo-light.svg" },
          { label: "Logo (dark), SVG", href: "/brand/vexcms-logo-dark.svg" },
          { label: "Mark only, SVG", href: "/brand/vexcms-mark.svg" },
          { label: "Logo (light), PNG", href: "/brand/vexcms-logo-light.png" },
          { label: "Logo (dark), PNG", href: "/brand/vexcms-logo-dark.png" },
          { label: "Mark only, PNG", href: "/brand/vexcms-mark.png" },
          { label: "Mark only, 240px PNG", href: "/brand/vexcms-mark-240.png" },
        ],
      },
    ],
  }
  if (existingBrandPage) {
    if (mode === "patch") {
      await ctx.db.patch(TABLE_SLUG_PAGES, existingBrandPage._id, brandPageDoc)
      patched.push("page:brand")
    } else {
      skipped.push("page:brand")
    }
  } else {
    await ctx.db.insert(TABLE_SLUG_PAGES, brandPageDoc)
    created.push("page:brand")
  }
```

**2 — footer "Brand" link at `public-copy.md` § Footer #10.** Anchor: `footerDoc.content[0].links`. "Brand" goes after "Buy Me a Coffee" (#9, step 10) and before "npm" (#11). If step 10 hasn't landed, it goes right before "npm"; the other entries keep their order. With step 10 in place, the slice reads:

```ts
          { label: "Buy Me a Coffee", href: "https://buymeacoffee.com/<bmc-user>" },
          { label: "Brand", href: "/brand" },
          { label: "npm", href: "https://www.npmjs.com/package/@vexcms/core" },
```

Verify: `pnpm --filter www typecheck && pnpm --filter www test`; after `pnpm --filter www exec convex run seed:reinit`, `/brand` renders, and every link on it returns 200. The footer shows "Brand" at its § Footer position.

#### apps/test/convex/seed.ts

Same two edits as above (new `brand` page between `existingRoadmapPage`'s block and whatever
block follows it in `apps/test`'s `runSeed`, plus the `Brand` footer link at § Footer #10), ported from
`apps/www/convex/seed.ts` once the diff above lands there. Run this only after the telemetry work
in `apps/test` is committed (brief: never depend on `apps/test`'s unstaged state).

#### apps/www/e2e/routes.ts

If the quality pass's step 2 has created this file, add the entry to its `QUALITY_ROUTES` array (cross-spec decision 3). `/brand` is seeded published, so it carries no `draft` flag and CI audits it on every preview. If the file doesn't exist yet, skip this: the quality pass's `inventory.md` already lists `/brand`.

```ts
  { path: "/brand" },
```

Verify: `pnpm --filter www typecheck && pnpm --filter www test`.

### Step 14 — www posts and the announcement post [dev]

T's announcement needs a canonical URL (`https://vexcms.dev/posts/vexcms-0-1-0`, from
`public-copy.md`) that every cross-post in U points at, and the `posts` collection and
`/posts/[slug]` route already exist in `apps/test` — www mirrors them (Design Decision 21) and
dogfoods the richtext field for the first time on www. The port drops `apps/test`'s test-only
fields (`relatedPost`, `relatedArticle`, `relatedField`) and its edit-view component slot overrides
(`EditorialChecklist`, `SaveWithAnalytics`), which exist only to exercise those two test surfaces. The announcement is seeded as a draft. Release ships it that way, and it's published from the admin on D1 morning (Design Decision 21, step 18's D1 note).

- [ ] `@vexcms/richtext-plate` (`workspace:*`) added to `apps/www/package.json`; `editor: plateEditor()` in `apps/www/src/vex.config.ts`
- [ ] `apps/www/src/db/constants/index.ts`: `TABLE_SLUG_POSTS`
- [ ] `apps/www/src/vexcms/collections/posts.ts` created: title, slug (`assertUniqueAmongPublished` validate), excerpt textarea, body richtext, ogImage upload, drafts + autosave, live preview, admin icon + labels
- [ ] `apps/www/src/vexcms/collections/index.ts`: export `posts`
- [ ] `apps/www/src/auth/access.ts`: `posts` added to `resources`, read-only for the `user` role (which `anonRole` resolves to)
- [ ] `apps/www/convex/posts.ts` created: `getBySlug`, `getBySlugPreview`, `publishedSlugs`
- [ ] `apps/www/src/lib/useSitePreviewMode.ts` created (shared port, extracted out of `apps/www/src/app/(frontend)/(site)/PageContent.tsx`'s private copy); `PageContent.tsx` imports it instead
- [ ] `apps/www/src/lib/metadata.ts`: `generatePostMetadata` (guided stub)
- [ ] `apps/www/src/app/(frontend)/(site)/posts/[slug]/page.tsx` and `PostContent.tsx` created (ports `apps/test`'s route, plus `generateMetadata`)
- [ ] `apps/www/src/app/sitemap.ts`: list published posts alongside pages
- [ ] `apps/www/convex/seed.ts`: the announcement post, `vex_status: "draft"`, with a Plate JSON body skeleton and the canonical URL from `public-copy.md`
- [ ] `apps/www/e2e/routes.ts`: `{ path: "/posts/vexcms-0-1-0", draft: true }` in `QUALITY_ROUTES`, if that file exists, plus the draft audit below
- [ ] `[dev]` Run `pnpm --filter www exec vex generate`

#### apps/www/package.json

1 edit.

**1 — add `@vexcms/richtext-plate` to `dependencies`, alongside the other `@vexcms/*` workspace packages.** The existing block reads:

```json
    "@vexcms/next": "workspace:*",
    "@vexcms/react": "workspace:*",
```

Insert `@vexcms/richtext-plate` between them, keeping the array's existing alphabetical-by-scope order:

```json
    "@vexcms/next": "workspace:*",
    "@vexcms/react": "workspace:*",
    "@vexcms/richtext-plate": "workspace:*",
```

Verify: `pnpm --filter www typecheck`.

#### apps/www/src/db/constants/index.ts

1 edit.

**1 — `TABLE_SLUG_POSTS`, beside `TABLE_SLUG_PAGES` under the "Site content" comment.** The existing block reads:

```ts
// Site content (marketing-site overlay)
export const TABLE_SLUG_PAGES = "pages" as const
export const TABLE_SLUG_HEADERS = "headers" as const
```

Add:

```ts
// Site content (marketing-site overlay)
export const TABLE_SLUG_PAGES = "pages" as const
export const TABLE_SLUG_POSTS = "posts" as const
export const TABLE_SLUG_HEADERS = "headers" as const
```

Verify: `pnpm --filter www typecheck`.

#### apps/www/src/vexcms/collections/posts.ts

New file. A near-verbatim port of `apps/test/src/vexcms/collections/posts.ts`: drops the
test-only `relatedPost`/`relatedArticle`/`relatedField` fields and the `components` edit-slot
overrides (`EditorialChecklist`, `SaveWithAnalytics` — both `apps/test`-only testing surfaces),
adds `excerpt` and `ogImage` (ported from `apps/www/src/vexcms/collections/pages.ts`'s `ogImage`
field), and carries `admin.icon`/`labels` per P-017.

```ts
import { defineCollection, richtext, text, textarea, upload } from "@vexcms/core"
import { assertUniqueAmongPublished } from "@vexcms/core/server"

import { TABLE_SLUG_IMAGES, TABLE_SLUG_POSTS } from "~/db/constants"

/**
 * The blog/announcement collection. Dogfoods the `richtext` field on www for
 * the first time — U's launch kit and feature series all point at posts
 * created here.
 */
export const posts = defineCollection({
  slug: TABLE_SLUG_POSTS,
  interfaceName: "Post",
  labels: {
    singular: "Post",
    plural: "Posts",
  },
  admin: {
    useAsTitle: "title",
    icon: "FilePen",
    view: {
      searchFields: ["title", "slug"],
    },
    livePreview: {
      url: (post) => `/posts/${post.slug}`,
    },
  },
  versions: {
    drafts: true,
    autosave: {
      enabled: true,
    },
  },
  fields: {
    title: text({
      label: "Title",
      required: true,
    }),
    slug: text<typeof TABLE_SLUG_POSTS>({
      label: "Slug",
      required: true,
      index: "by_slug",
      description: "URL-friendly post path, e.g. vexcms-0-1-0.",
      validate: async ({ value, doc, ctx }) => {
        await assertUniqueAmongPublished({
          ctx,
          collection: TABLE_SLUG_POSTS,
          indexName: "by_slug",
          field: "slug",
          value,
          excludeId: doc._id,
        })
      },
    }),
    excerpt: textarea({
      label: "Excerpt",
      description: "Short summary shown on a future posts index and used as the meta description.",
    }),
    body: richtext({
      label: "Body",
      mediaCollectionSlug: TABLE_SLUG_IMAGES,
    }),
    ogImage: upload({
      to: TABLE_SLUG_IMAGES,
      label: "OG Image",
      admin: { position: "sidebar" },
    }),
  },
})
```

Verify: `pnpm --filter www typecheck`.

#### apps/www/src/vexcms/collections/index.ts

1 edit.

**1 — export `posts`, alongside the existing re-exports (alphabetical).** The existing file reads:

```ts
export * from "./footers"
export * from "./headers"
export * from "./images"
export * from "./leads"
export * from "./pages"
```

Add `posts` between `pages` and `products`:

```ts
export * from "./footers"
export * from "./headers"
export * from "./images"
export * from "./leads"
export * from "./pages"
export * from "./posts"
export * from "./products"
```

Verify: `pnpm --filter www typecheck`.

#### apps/www/src/vex.config.ts

2 edits. Everything else in the file is unchanged.

**1 — import `plateEditor`, beside the existing `@vexcms/file-storage-convex/client` import.** The existing imports read:

```ts
import { authSchema } from "@convex/auth/schema";
import { betterAuthCollections } from "@vexcms/better-auth/client";
import { defineConfig } from "@vexcms/core";
import { uploadFile } from "@vexcms/file-storage-convex/client";
```

Add:

```ts
import { authSchema } from "@convex/auth/schema";
import { betterAuthCollections } from "@vexcms/better-auth/client";
import { defineConfig } from "@vexcms/core";
import { uploadFile } from "@vexcms/file-storage-convex/client";
import { plateEditor } from "@vexcms/richtext-plate";
```

**2 — `editor: plateEditor()`, beside `authCollections` in the `defineConfig({…})` call, and `posts` added to the `collections` array import and list.** The existing call reads:

```ts
const vexConfig = defineConfig({
  access,
  authCollections: betterAuthCollections(authSchema),
  admin: {
```

Change to:

```ts
const vexConfig = defineConfig({
  access,
  authCollections: betterAuthCollections(authSchema),
  editor: plateEditor(),
  admin: {
```

And the collections import/array:

```ts
import { footers, headers, images, leads, pages, posts, products, testimonials, themes, users } from "~/vexcms/collections";
```

```ts
  collections: [users, pages, posts, headers, footers, themes, testimonials, products, leads],
```

Verify: `pnpm --filter www typecheck`.

#### apps/www/src/auth/access.ts

2 edits. Everything else in the file is unchanged.

**1 — add `posts` to the `resources` array, alongside `pages`.** The existing call reads:

```ts
  resources: [images, users, pages, siteSettings, themes, headers, footers, testimonials, products, leads],
```

Change to:

```ts
  resources: [images, users, pages, posts, siteSettings, themes, headers, footers, testimonials, products, leads],
```

(Add `posts` to the `~/vexcms/collections` import at the top of the file alongside `pages`.)

**2 — `[USER_ROLES.user]`: add `posts: readOnly`, mirroring `pages: readOnly`.** The existing entry reads:

```ts
    [USER_ROLES.user]: {
      "*": false,
      pages: readOnly,
```

Change to:

```ts
    [USER_ROLES.user]: {
      "*": false,
      pages: readOnly,
      posts: readOnly,
```

This grants `read` only (`"*": false, read: true`) — the same shape `pages` already uses. `read`
on a versioned resource resolves published rows only; nothing in this role grants `readDrafts`, so
an anonymous visitor (who resolves to `anonRole: USER_ROLES.user`) cannot read a draft post. This
is the same posture `pages.ts`'s own comment documents for `pages`, so there is no new gate to add
here — `getBySlugPreview` below is the only caller that ever requests `readDrafts`, and only from
an authenticated admin session.

Verify: `pnpm --filter www typecheck && pnpm --filter www test`. As an anonymous visitor the
seeded announcement's URL 404s until it's published (see the route below).

**Generate the Convex schema and types.** Run it here, once the collection is registered: `convex/posts.ts` and the route below read the generated `Post` types.


- [ ] `[dev]` Run `pnpm --filter www exec vex generate`

#### apps/www/convex/posts.ts

New file. A port of `apps/test/convex/posts.ts` (`getBySlug`, `getBySlugPreview`; the collection constant, index name and access shapes match between the two apps), plus `publishedSlugs` for the sitemap, ported from `apps/www/convex/pages.ts`'s query of the same name.

```ts
import { DRAFT_ACTIONS } from "@vexcms/core"
import { v } from "convex/values"

import { TABLE_SLUG_POSTS } from "~/db/constants"
import { find, publishedSlugs as readPublishedSlugs } from "~/vexcms/api"

import { query } from "./_generated/server"

/**
 * Returns the post document matching the given slug.
 *
 * Uses the `by_slug` index for efficient lookup. Returns an empty array if
 * no post with that slug exists (caller handles 404 via `notFound()`).
 *
 * Access is bypassed: this is read at build/request time by anonymous
 * visitors on the public post page, who carry no session and would
 * otherwise be filtered out by the default-deny RBAC posture.
 *
 * @param args.slug - URL slug to look up (e.g. `"vexcms-0-1-0"`)
 * @returns Array containing the matching `Post` document, or empty if not found.
 */
export const getBySlug = query({
  args: v.object({
    slug: v.string(),
  }),
  handler: async (ctx, { slug }) => {
    return await find({
      ctx,
      collection: TABLE_SLUG_POSTS,
      withIndex: {
        name: "by_slug",
        range: (q) => q.eq("slug", slug),
      },
      limit: 1,
      access: {
        bypass: true,
      },
    })
  },
})

/**
 * Returns the post matching `slug`, preferring its draft row when one exists —
 * the live-preview base layer's authenticated counterpart to `getBySlug`, same
 * contract as `pages.getBySlugPreview`. Called only when `PostContent.tsx`'s
 * `useSitePreviewMode` detects an active preview session.
 *
 * Never bypasses access: a row reaches the caller only when their session holds
 * `readDrafts` on `posts` (`~/auth/access.ts`). Everyone else gets `[]`.
 *
 * @param args.slug - The post slug to preview.
 * @returns The draft row if one exists, else the published row, else `[]`.
 */
export const getBySlugPreview = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const matches = await find({
      ctx,
      collection: TABLE_SLUG_POSTS,
      withIndex: {
        name: "by_slug",
        range: (q) => q.eq("slug", slug),
      },
      drafts: true,
      access: { action: DRAFT_ACTIONS.readDrafts },
    })
    const draft = matches.find((doc) => doc.vex_status === "draft")
    return draft ? [draft] : matches.filter((doc) => doc.vex_status === "published")
  },
})

/**
 * Returns `{ slug, createdAt, updatedAt? }` for every published post document.
 *
 * Consumed by `app/sitemap.ts`. Access is bypassed for the same reason
 * `getBySlug` bypasses it: read at build time by anonymous crawlers, who
 * carry no session.
 */
export const publishedSlugs = query({
  args: {},
  handler: async (ctx) => {
    return await readPublishedSlugs({
      access: { bypass: true },
      collection: TABLE_SLUG_POSTS,
      ctx,
    })
  },
})
```

Verify: `pnpm --filter www typecheck && pnpm --filter www test`.

#### apps/www/src/lib/useSitePreviewMode.ts

New file. A byte-for-byte port of `apps/test/src/lib/useSitePreviewMode.ts`, extracted as its own
module (`apps/test` carries the same file at this same path already; www previously had this logic
inlined and private inside `PageContent.tsx`, which the edit below removes in favor of this shared
copy).

```ts
"use client"

import { useEffect, useState } from "react"

import { LIVE_PREVIEW_COOKIE, LIVE_PREVIEW_QUERY_PARAM } from "@vexcms/core"

/**
 * Whether this page load is inside an active live-preview session — both
 * `?vexLivePreview=1` and the session-verified `vex-live-preview` marker cookie
 * `proxy.ts` sets (`grantPreviewIfRequested`) are present.
 *
 * `PageContent` and `PostContent` read this to pick their base query. Mirrors
 * `@vexcms/react`'s internal `useLivePreviewEnabled` rather than importing it: the
 * boolean is needed to choose a query before `useLivePreviewQuery` runs, and widening
 * that package's public surface for this isn't worth five lines.
 *
 * Read in an effect, never during render, so the page stays statically
 * prerenderable and the first client render matches the server's.
 *
 * Advisory only: it just picks which query runs. The real boundary is each
 * `getBySlugPreview`'s server-side `readDrafts` check — a forged cookie selects the
 * preview query and gets an empty result, never draft content.
 *
 * @returns `true` once both signals are present in the browser; `false` before mount
 *   and on every load outside live preview.
 */
export function useSitePreviewMode(): boolean {
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    const previewRequested =
      new URLSearchParams(window.location.search).get(LIVE_PREVIEW_QUERY_PARAM) === "1"
    const sessionVerified = document.cookie
      .split("; ")
      .some((cookie) => cookie === `${LIVE_PREVIEW_COOKIE}=1`)
    setPreviewMode(previewRequested && sessionVerified)
  }, [])

  return previewMode
}
```

#### apps/www/src/app/(frontend)/(site)/PageContent.tsx

2 edits. Everything else in the file is unchanged.

**1 — import the shared `useSitePreviewMode`, dropping the now-unused `useEffect`/`useState` and
`LIVE_PREVIEW_COOKIE`/`LIVE_PREVIEW_QUERY_PARAM` imports once this file no longer defines it
itself.** The existing imports read:

```ts
"use client"

import { useEffect, useState } from "react"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { LIVE_PREVIEW_COOKIE, LIVE_PREVIEW_QUERY_PARAM } from "@vexcms/core"
import { RenderBlocks, useLivePreviewQuery } from "@vexcms/react"
```

Change to:

```ts
"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { RenderBlocks, useLivePreviewQuery } from "@vexcms/react"
```

Add `import { useSitePreviewMode } from "~/lib/useSitePreviewMode"` to the `~/`-prefixed import
group below, alongside the existing `~/vexcms/blocks` import.

**2 — delete the private `useSitePreviewMode` function.** Remove the whole block, from its leading
doc comment (`/**\n * Whether this page load is inside an active live-preview session — both`)
through its closing brace:

```ts
function useSitePreviewMode(): boolean {
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    // Neither alone suffices: a pasted preview URL without a verified session, or an
    // admin browsing normally, must both stay on the published copy.
    const previewRequested =
      new URLSearchParams(window.location.search).get(LIVE_PREVIEW_QUERY_PARAM) === "1"
    const sessionVerified = document.cookie
      .split("; ")
      .some((cookie) => cookie === `${LIVE_PREVIEW_COOKIE}=1`)
    setPreviewMode(previewRequested && sessionVerified)
  }, [])

  return previewMode
}
```

Nothing replaces it — `PageContent`'s own `previewModeActive = useSitePreviewMode()` call is
unchanged, now resolving to the imported shared function.

Verify: `pnpm --filter www typecheck && pnpm --filter www test`.

#### apps/www/src/lib/metadata.ts

1 addition: `generatePostMetadata`, a new guided-stub export beside the existing
`generatePageMetadata`.

```ts
/**
 * Generate Next.js Metadata for one post, by slug.
 *
 * @param props - Input props.
 * @param props.slug - The post slug to fetch.
 * @returns Metadata for the post, or the site default when the slug doesn't
 *   resolve or Convex is unreachable.
 * @throws Never — degrades to the site default on any failure.
 */
export async function generatePostMetadata(props: { slug: string }): Promise<Metadata> {
  // TODO: implement
  // 1. Fetch `siteSettings` the same way `generatePageMetadata` does
  //    (`getGlobal`/`vex.query`), for the site-wide title suffix and default OG image.
  // 2. Fetch the post via `api.posts.getBySlug({ slug: props.slug })`.
  //    a. On an empty result (no match) or an unreachable Convex deployment
  //       → fall back to the site default (same shape `generatePageMetadata`
  //       returns for a missing page: bare title, no OG image).
  // 3. Title: the post's `title`, suffixed with `TITLE_SUFFIX`.
  // 4. Description: `firstNonBlank(post.excerpt, settings.description)`.
  // 5. OG image: `firstNonBlank(post.ogImage?.[0], settings.ogImage?.[0])`,
  //    resolved to a URL via `resolveMediaUrl` — same pattern as
  //    `generatePageMetadata`'s `pageOgImageId ?? siteOgImageId`.
  // 6. Emit `title`, `description`, `metadataBase`, `alternates.canonical`
  //    always; `openGraph`/`twitter` only when an image or handle resolved —
  //    same contract `generatePageMetadata` already holds.
  // Edge cases: an unreachable Convex deployment or a missing post must both
  // degrade to the site default, never throw — this runs at build time.
  throw new Error("Not implemented")
}
```

Verify: `pnpm --filter www typecheck && pnpm --filter www test`.

#### apps/www/src/app/(frontend)/(site)/posts/[slug]/PostContent.tsx

New file. A byte-for-byte port of `apps/test/src/app/(frontend)/(site)/posts/[slug]/PostContent.tsx`
— same `useSitePreviewMode` (now `apps/www/src/lib/useSitePreviewMode.ts`, see below) +
`useLivePreviewQuery` base-layer swap, same `RichText` render. Only the `Post` type import source
changes (`~/vex.types`, www's own generated types).

```tsx
"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { useLivePreviewQuery } from "@vexcms/react"
import { RichText } from "@vexcms/richtext-plate/render"

import type { Post } from "~/vex.types"

import { Container } from "~/components/Container"
import { useSitePreviewMode } from "~/lib/useSitePreviewMode"

export interface PostContentProps {
  /** Server-fetched `posts.getBySlug` result, hydrated as the query's initial data. */
  initialData: Post[]
  /** URL slug to render. */
  slug: string
}

/**
 * Renders one post's title and richtext `body`, live-preview aware.
 *
 * Same base-layer swap as `PageContent`: `posts.getBySlug` (published,
 * `access.bypass`) normally, `posts.getBySlugPreview` (session-gated on
 * `readDrafts`) once `useSitePreviewMode` confirms a preview session.
 * `useLivePreviewQuery` then overlays the editor's unsaved values, so typing in
 * the admin's Plate editor re-renders `body` here without a save.
 */
export function PostContent({ initialData, slug }: PostContentProps) {
  const previewModeActive = useSitePreviewMode()

  const { data: post } = useLivePreviewQuery(
    {
      ...convexQuery(previewModeActive ? api.posts.getBySlugPreview : api.posts.getBySlug, {
        slug,
      }),
      initialData,
    },
    "posts",
  )

  if (!post) return null

  return (
    <Container className="py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{post.title}</h1>
      <RichText className="prose mt-8 max-w-[46rem]" content={post.body ?? []} />
    </Container>
  )
}
```

#### apps/www/src/app/(frontend)/(site)/posts/[slug]/page.tsx

New file. Ports `apps/test`'s route (`vex.query(api.posts.getBySlug, …)` → `notFound()` → render).
`generateMetadata` itself is full code — it's a one-line delegation to `generatePostMetadata`, a new
guided-stub helper added to `~/lib/metadata.ts` below, built on `generatePageMetadata`'s pattern
(fetch site settings, merge with a per-document override, fall back cleanly when Convex is
unreachable).

```ts
import type { Metadata } from "next"

import { api } from "@convex/_generated/api"
import { notFound } from "next/navigation"

import { generatePostMetadata } from "~/lib/metadata"
import { vex } from "~/lib/vex"

import { PostContent } from "./PostContent"

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return generatePostMetadata({ slug })
}

/**
 * One public post, resolved by slug.
 *
 * Dogfoods the `richtext` field end to end: `posts.body` is saved by the
 * Plate editor in the admin panel (`editor: plateEditor()` in
 * `vex.config.ts`) and rendered through `RichText` by `PostContent`, which
 * also subscribes to live preview so admin edits show up without a save.
 */
export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const initialData = await vex.query(api.posts.getBySlug, { slug })

  if (initialData.length === 0) {
    notFound()
  }

  return <PostContent initialData={initialData} slug={slug} />
}
```

#### apps/www/src/app/sitemap.ts

1 edit.

**1 — list published posts, beside the existing `pageEntries` mapping.** The existing body reads:

```ts
  let entries: { createdAt: number; slug: string; updatedAt?: number }[] = []
  try {
    entries = await vex.query(api.pages.publishedSlugs, {})
  } catch {
    entries = []
  }

  const pageEntries: MetadataRoute.Sitemap = entries
    .filter((entry) => entry.slug !== "home")
    .map((entry) => ({
      url: `${baseUrl}/${entry.slug}`,
      ...(entry.updatedAt === undefined ? {} : { lastModified: new Date(entry.updatedAt) }),
    }))

  return [{ lastModified: new Date(), url: baseUrl }, ...pageEntries]
```

Change to:

```ts
  let entries: { createdAt: number; slug: string; updatedAt?: number }[] = []
  try {
    entries = await vex.query(api.pages.publishedSlugs, {})
  } catch {
    entries = []
  }

  let postEntries: { createdAt: number; slug: string; updatedAt?: number }[] = []
  try {
    postEntries = await vex.query(api.posts.publishedSlugs, {})
  } catch {
    postEntries = []
  }

  const pageEntries: MetadataRoute.Sitemap = entries
    .filter((entry) => entry.slug !== "home")
    .map((entry) => ({
      url: `${baseUrl}/${entry.slug}`,
      ...(entry.updatedAt === undefined ? {} : { lastModified: new Date(entry.updatedAt) }),
    }))

  const postSitemapEntries: MetadataRoute.Sitemap = postEntries.map((entry) => ({
    url: `${baseUrl}/posts/${entry.slug}`,
    ...(entry.updatedAt === undefined ? {} : { lastModified: new Date(entry.updatedAt) }),
  }))

  return [{ lastModified: new Date(), url: baseUrl }, ...pageEntries, ...postSitemapEntries]
```

Verify: `pnpm --filter www typecheck && pnpm --filter www test`.

#### apps/www/convex/seed.ts

1 edit (plus the `posts` import and `TABLE_SLUG_POSTS` constant import added at the top of the
file, alongside the existing `~/db/constants` and `~/vexcms/blocks/constants` imports).

**1 — the announcement post insert, added to `runSeed` beside the `brand` page block from step 13**
(after `existingBrandPage`'s insert/patch, before `return` or the next seeded document — wherever
`runSeed`'s existing block order puts posts next to pages). The post is seeded as a draft, so its
locator cannot filter on `vex_status: "published"` the way the page locators do — a draft-only row
has no published twin to find, and a status-filtered `.first()` would never match it, inserting a
duplicate on every `init` re-run. Collect by slug instead and prefer a non-draft row, the same
shape `getBySlugPreview` already uses to pick between a draft and its published twin. The Plate
JSON body below uses the node shapes documented in `packages/richtext-plate/src/test/fixtures.ts`
(`{ type: "h2", children: [{ text }] }` for headings, `{ type: "p", children: [{ text }] }` for
paragraphs) — replace the placeholder prose with the real announcement before publishing.

```ts
  const announcementRows = await ctx.db
    .query(TABLE_SLUG_POSTS)
    .withIndex("by_slug", (q) => q.eq("slug", "vexcms-0-1-0"))
    .collect()
  const existingAnnouncementPost =
    announcementRows.find((row) => row.vex_status !== "draft") ?? announcementRows[0]
  const announcementPostDoc: WithoutSystemFields<Doc<typeof TABLE_SLUG_POSTS>> = {
    title: "VexCMS 0.1.0",
    slug: "vexcms-0-1-0",
    excerpt: "The first stable VexCMS release — replace this with the real summary before publishing.",
    vex_status: "draft",
    body: [
      { type: "h2", children: [{ text: "VexCMS 0.1.0" }] },
      {
        type: "p",
        children: [
          {
            text:
              "PLACEHOLDER — replace with the real announcement body before publishing. " +
              "Draw from the release notes and the docs roadmap's shipped list.",
          },
        ],
      },
      { type: "h2", children: [{ text: "What's new" }] },
      { type: "p", children: [{ text: "PLACEHOLDER — highlight the shipped list." }] },
    ],
  }
  if (existingAnnouncementPost) {
    if (mode === "patch") {
      await ctx.db.patch(TABLE_SLUG_POSTS, existingAnnouncementPost._id, announcementPostDoc)
      patched.push("post:vexcms-0-1-0")
    } else {
      skipped.push("post:vexcms-0-1-0")
    }
  } else {
    await ctx.db.insert(TABLE_SLUG_POSTS, announcementPostDoc)
    created.push("post:vexcms-0-1-0")
  }
```

Verify: `pnpm --filter www typecheck && pnpm --filter www test`. After `pnpm --filter www exec convex run seed:reinit`, the
announcement opens as a draft in the admin. Publishing it on the dev deployment, then
unpublishing, shows and hides it at `/posts/vexcms-0-1-0`. Running `seed:reinit` again after it has
been published does not insert a duplicate draft.

#### apps/www/e2e/routes.ts

If the quality pass's step 2 has created this file, add the entry to its `QUALITY_ROUTES` array (cross-spec decision 3). The announcement stays a draft until D1, so it carries `draft: true` and CI (with `CI` set) skips it. If the file doesn't exist yet, skip this: the quality pass's `inventory.md` already lists the route.

```ts
  { path: "/posts/vexcms-0-1-0", draft: true },
```

**Draft audit.** Follow `.agent/docs/product/launch-cross-spec-decisions.md` decision 3 (the quality pass's step 2 records the same procedure): before L, publish the announcement on the dev deployment, run the www suite locally with `CI` unset, record the result in `2026-11-06-quality-pass/findings.md`, then unpublish. The `draft: true` flag is removed in the same edit that publishes the post for real on D1 (step 18's D1 note).

Verify: `pnpm --filter www exec vex generate && pnpm --filter www typecheck && pnpm --filter www test && pnpm --filter www build`. After `seed:reinit`, the seeded announcement opens as a draft in the running admin, and live preview renders it at `/posts/vexcms-0-1-0`. As an anonymous visitor the URL 404s. Publishing it on the dev deployment, then unpublishing, shows and hides it. The draft audit above has a row in quality-pass `findings.md`.


### Step 15 — Private planning docs out of the public repo [dev]

The public GitHub repo tracks `.agent/` on both `master` and `dev` today, so the pitch deck,
tier pricing and the plan's private-tier notes are readable by any stranger who opens the
tree — a launch blocker for L. The whole `.agent/` moves to the central `../agents` link with
`harness install` (option A, cross-spec decision 10), as soon as no session holds unstaged
`.agent/` edits. The symlink keeps every `.agent/docs/specs/…` path valid, so no spec, skill or
`AGENTS.md` pointer changes. The inventory below is the evidence for the one decision left open:
whether to rewrite history.

- [ ] `[agent]` `.agent/docs/specs/2026-11-06-public-presence/private-inventory.md` created with the content below, the search re-run at implementation time (this spec folder included: `spec.md` steps 15 and 19 and the inventory itself quote the exposed lines)
- [ ] `[dev]` Confirm no session has unstaged `.agent/` edits: `git status --short .agent` prints nothing in every worktree of the bare repo
- [ ] `[dev]` Move `.agent/` to `../agents`, stop tracking it, and link it back with `harness install`
- [ ] `[dev]` Decide on history rewriting and record the decision in the file's "History rewrite" section

**The move.** Run from the repo root of the `dev` worktree, then once in each other worktree after it pulls the commit:

```bash
git rm -r --cached --quiet .agent
mv .agent ../agents
harness install
git check-ignore -q .agent || printf '\n.agent\n' >> .gitignore
git add .gitignore
git commit -m "chore: move .agent planning docs out of the repo"
```

`harness install` creates the `.agent` link to `../agents` (`harness doctor`'s own suggestion: "move it to ../agents and re-run `harness install` to link it centrally"). If it already ignores the link, the `.gitignore` line is skipped. Every worktree of the bare repo then shares one `.agent/`, which also clears doctor's per-worktree drift warning.

#### .agent/docs/specs/2026-11-06-public-presence/private-inventory.md

The table below is from a read-only `git ls-files` + content search run on 2026-11-06 (search
terms: `\$[0-9]`, `Pro`/`Agency`/`Enterprise`, `licen[cs]e key`, `ENT-0`, `ENT-P`, `maprios`,
`business model`, `pitch`, against all 2,540 tracked files). Every hit is under `.agent/`, so
option A removes all of them from the tree. **Re-run the same search at implementation time**
and confirm nothing outside `.agent/` matches.

```markdown
# Private planning inventory — 2026-11-06-public-presence

Read-only search over `git ls-files` (2,540 tracked files, 2026-11-06). Scope: `.agent/` planning
documents naming tiers, prices, licence enforcement or customer specifics. All of `.agent/` leaves
the repo (option A), so this list is the record of what was exposed, for the history-rewrite
decision below. Public-surface paid copy (`README.md`, `apps/docs/.../roadmap.md`,
`apps/www`/`apps/test` seed FAQs) is a separate sweep, owned by steps 9–11.

## Exposed files

| Path | What's private | Hits | Lines |
|---|---|---:|---:|
| `.agent/docs/research/pitch-deck/04-business-model.md` | Tier prices, unit economics | 73 | 182 |
| `.agent/docs/research/pitch-deck/sources/business-model-comps.md` | Competitor pricing comps backing the tier design | 91 | 244 |
| `.agent/docs/research/pitch-deck/sources/convex-ecosystem.md` | Convex-cost assumptions behind the pricing model | 41 | 199 |
| `.agent/docs/research/pitch-deck/sources/market-size.md` | Market-sizing math feeding the business model | 46 | 230 |
| `.agent/docs/research/pitch-deck/sources/competitors.md` | Competitor-pricing research | 37 | 255 |
| `.agent/docs/research/pitch-deck/DESIGN-AGENT-PROMPT.md` | Pitch-deck brief naming tiers and asks | 37 | 155 |
| `.agent/docs/research/pitch-deck/03-competition.md` | Competitive pricing positioning | 17 | 124 |
| `.agent/docs/research/pitch-deck/README.md` | Pitch-deck index naming every file above | 16 | 88 |
| `.agent/docs/research/pitch-deck/07-gaps-and-asks.md` | Funding ask, ENT-P paperwork gaps | 12 | 78 |
| `.agent/docs/research/pitch-deck/06-traction-roadmap-team.md` | ENT-0/ENT-P roadmap, team/traction numbers | 8 | 89 |
| `.agent/docs/research/pitch-deck/02-market-why-now.md` | Market timing tied to the pricing model | 9 | 64 |
| `.agent/docs/research/pitch-deck/05-platform-convex.md` | Convex cost structure behind pricing | 7 | 90 |
| `.agent/docs/research/pitch-deck/01-problem-solution-product.md` | Weak hits (2) — keep with the set for one coherent deck | 2 | 136 |
| `.agent/docs/product/post-v0.1.0-plan.md` | Tier design, licence enforcement, customer specifics (named in Design Decision 25) | 35 | 448 |
| `.agent/docs/product/maprios-roadmap-gaps.md` | Named customer (maprios) gap analysis | 12 | 197 |
| `.agent/docs/research/legacy-planning/multi-component-implementation.md` | Multi-component workspace tier design | 36 | 586 |
| `.agent/docs/research/legacy-planning/maprios-migration-todo.md` | Named customer (maprios) migration checklist | 22 | 330 |
| `.agent/docs/research/legacy-planning/roadmap-monetization-strategy-v2.md` | Monetization strategy, tiers | 13 | 686 |
| `.agent/docs/research/legacy-planning/maprios-migration-analysis.md` | Named customer (maprios) site analysis | 5 | 517 |
| `.agent/docs/design/claude-design/www/pages.jsx` | Pricing-page UI mock with tier names/prices | 11 | 795 |
| `.agent/docs/research/legacy-planning/README.md` | Index pointing at the maprios/monetization files above | 1 | 23 |
| `.agent/docs/research/legacy-planning/v0.1.0-launch-roadmap.md` | One "enterprise moat" row in a feature table | 1 | 450 |
| `.agent/docs/research/legacy-planning/multi-component-architecture.md` | One "Post-Enterprise" phase label | 1 | 605 |
| `.agent/docs/product/v0.1.0-launch-plan.md` | Tier names in the Q section and item 16's intro; the customer name in a non-goals list | 6 | 1947 |
| `.agent/docs/product/roadmap.md` | Tier names in an otherwise-public milestone roadmap | 16 | — |
| `.agent/docs/specs/2026-11-06-public-presence/` | Steps 15 and 19 and this file quote the lines above | — | — |

Outside `.agent/`: nothing (re-check: `rg -n '\$995|\$2,500|Agency tier|maprios' $(git ls-files | rg -v '^\.agent/')` prints nothing).

## History rewrite — record the decision

`git filter-repo` + force-push removes the files from every commit in this repo's history,
not just HEAD. **Record which was chosen, and why:**

- [ ] Rewrite history: forks and existing clones keep the old history until they re-fetch
      (GitHub's cached blob/commit views may serve old content for a time even after the
      force-push); every other worktree of this bare repo must `git fetch` + reset rather
      than merge. Destructive — the developer's explicit call, not a default.
- [ ] Do not rewrite history: the files stop appearing in new clones and on `ref=dev`/`ref=master`
      going forward, but anyone who already cloned, or who checks out an old commit SHA, still
      has them. Decide this is acceptable (pricing details stale by launch, no live credentials
      in the inventoried files) or escalate to a rewrite.

Decision: _______________________________________________ (filled in by the developer at this step)
```

Verify: on GitHub, `gh api "repos/ianyimi/vex/contents/.agent?ref=dev"` returns `404` once the commit is pushed. `git ls-files .agent | wc -l` prints `0`, `test -L .agent && ls .agent/docs/specs/2026-11-06-public-presence` lists this spec through the link, and `rg -n '\$995|\$2,500|Agency tier|maprios' $(git ls-files)` returns nothing. `harness doctor` is clean (no per-worktree warning). The History rewrite section is filled in either way.

### Step 16 — Demo media: hero GIF, screenshots, demo video [dev] [blocked: quality-pass steps 6–7 (admin and www visual fixes)]

Recorded media freezes the UI, so this waits for both of the quality pass's visual-fix steps
(step 6 for the admin, step 7 for www). Recording first would ship pre-fix screens into the
README, `/brand`, `/tour` and U's posts. It's one shared media session (Design Decision 32,
cross-spec decision 7): this step's demo take and screenshots, launch-kit step 8's 4 feature
clips, and launch-infra step 10's 4 `/tour` screenshots, recaptured. The demo take covers the
whole scaffold-to-publish loop once; the GIF is exported from it.

- [ ] Record one take of building a site with the packages (scaffold → collection → admin edit → live preview → publish). Export a 30–60 s MP4 and a cut-down looping GIF
- [ ] Screenshots at fixed sizes (1280×800 admin, 1280×800 live preview, 390×844 mobile admin, 1270×760 Product Hunt gallery)
- [ ] Same session: launch-kit step 8's 4 clips into `apps/www/public/launch/` (its spec owns their shot lists and checks)
- [ ] Same session: recapture the 4 `/tour` screenshots into `apps/www/public/tour/` and copy them to `apps/test/public/tour/`
- [ ] `apps/www/public/brand/`: add the MP4, screenshots and a `vexcms-media-kit.zip`; extend the `/brand` CTA actions in both seeds, then `seed:reinit`
- [ ] `README.md` hero: the looping GIF linking to the MP4 on `/brand`

**Recording plan (tools-agnostic — screen recorder of your choice; this is the shot list and
narration beats, not a tool invocation):**

1. Terminal, empty directory: run the scaffold command (step 17's three-command quick start,
   once it exists — today's equivalent is `pnpm create vexcms@alpha demo-site`).
2. Open the running app in a browser; sign up, land in `/admin` as the auto-promoted admin.
3. Add one field to an existing collection in `vex.config.ts` (narrate: "collections are
   defined in one config file"), save, show `vex dev`'s watcher regenerate the schema.
4. In the admin panel, create a document, fill the new field, open live preview side-by-side.
5. Edit the field value; show the live preview update without a page reload.
6. Publish the document; show the public page render it.
7. Cut to the published page as an anonymous visitor.

**Export specs.**
- MP4: H.264, 30–60 s, ≤ 10 MB (GitHub's release-attachment size budget if it's also attached
  there, per Design Decision 23 — the README embeds only the GIF).
- GIF: ≤ 10 MB, loops on GitHub (GIFs autoplay/loop; uploaded MP4s render a non-autoplaying
  player — Design Decision 23). Suggested: 12 fps, 720 px wide, two-pass palette encode:

```bash
ffmpeg -y -i vexcms-demo.mp4 -vf "fps=12,scale=720:-1:flags=lanczos,palettegen" /tmp/vexcms-palette.png
ffmpeg -y -i vexcms-demo.mp4 -i /tmp/vexcms-palette.png \
  -lavfi "fps=12,scale=720:-1:flags=lanczos[x];[x][1:v]paletteuse" \
  apps/www/public/brand/vexcms-demo.gif
```

Check the output size after encoding; drop fps to 10 or width to 600 if it's still over 10 MB.

**Launch-kit clips, same session.** Record launch-kit step 8's 4 silent clips (`real-time-admin-and-live-preview.mp4`, `one-config-schema-and-types.mp4`, `access-control-hooks-validation.mp4`, `create-vexcms-to-deployed.mp4`) into `apps/www/public/launch/` while the deployment and browser are set up. Their shot lists, export limits (H.264, ≤ 60 s, ≤ 10 MB, no audio stream) and verify live in `2026-11-06-launch-kit-final-review` step 8; this step only shares the session.

**`/tour` recapture, same session.** `/tour` shipped with pre-fix screenshots (launch-infra step 10). Recapture the same 4 shots at 1280×800 (dashboard, list view with a saved view, edit view with live preview, media library) from the fixed admin, overwrite the files in `apps/www/public/tour/` under their existing names (so `apps/www/src/app/tour/page.tsx` needs no edit), and copy them into `apps/test/public/tour/`:

```bash
cp apps/www/public/tour/*.png apps/test/public/tour/
```

**Screenshots:** capture at the browser's native resolution at each fixed size (devtools
responsive mode, or an actual device for the 390×844 mobile shot) — `screenshot-admin-1280x800.png`,
`screenshot-live-preview-1280x800.png`, `screenshot-admin-mobile-390x844.png`,
`screenshot-producthunt-1270x760.png` (a polished hero-style shot, not a raw admin screen).

**Files under `apps/www/public/brand/`** (joining step 13's logo files):
`vexcms-demo.mp4`, `vexcms-demo.gif`, `screenshot-admin-1280x800.png`,
`screenshot-live-preview-1280x800.png`, `screenshot-admin-mobile-390x844.png`,
`screenshot-producthunt-1270x760.png`, `vexcms-media-kit.zip`.

```bash
cd apps/www/public/brand && zip -r vexcms-media-kit.zip \
  vexcms-logo-light.svg vexcms-logo-dark.svg vexcms-mark.svg \
  vexcms-logo-light.png vexcms-logo-dark.png vexcms-mark.png vexcms-mark-240.png \
  vexcms-demo.mp4 \
  screenshot-admin-1280x800.png screenshot-live-preview-1280x800.png \
  screenshot-admin-mobile-390x844.png screenshot-producthunt-1270x760.png
```

**Seed CTA additions.** Step 13 seeds the `brand` page as a Hero (compact) + CTA block, with
one CTA action per logo file (Design Decision 22). Once that block exists in
`apps/www/convex/seed.ts` and `apps/test/convex/seed.ts`, push two more entries onto its
`actions` array, matching the shape of the entries step 13 already added:

```ts
{ label: "Demo video (MP4)", href: "/brand/vexcms-demo.mp4" },
{ label: "Media kit (.zip)", href: "/brand/vexcms-media-kit.zip" },
```

Verify step 13's file for its exact CTA block id and existing action shape before adding
these — this spec section is written before step 13 lands, so the anchor above is the shape,
not a quoted line from the real file.

#### README.md

**1 — replace the `preview.png` hero with the looping GIF.** The current hero (the
`<p align="center">` block wrapping `.github/assets/preview.png`):

```markdown
<p align="center">
  <img src=".github/assets/preview.png" alt="The VexCMS admin panel editing a Roadmap page: a title, a slug, and an ordered Content field of Hero, Stats, and Roadmap blocks, with the collections and globals sidebar on the right." width="100%">
</p>
```

becomes:

```markdown
<p align="center">
  <a href="https://vexcms.dev/brand/vexcms-demo.mp4">
    <img src="https://vexcms.dev/brand/vexcms-demo.gif" alt="Scaffolding a VexCMS site, adding a field to a collection, editing a document with live preview open side by side, and publishing it." width="100%">
  </a>
</p>
```

The GIF links to the MP4 on `/brand` (Design Decision 23); both URLs are the canonical ones
from `public-copy.md`'s "Canonical URLs" section (`/brand`).

Verify: the GIF is ≤ 10 MB and loops on GitHub; the MP4 is H.264, 30–60 s, ≤ 10 MB if it's
also attached on GitHub; after `seed:reinit`, every new `/brand` link returns 200 (`curl -sI http://localhost:3030/brand/<file>`);
the README hero renders on the branch preview. `diff -r apps/www/public/tour apps/test/public/tour` prints nothing, and `/tour` on :3030
shows the recaptured screens. Launch-kit step 8's verify passes for its 4 clips.

### Step 17 — README quick start [dev] [blocked: launch-infra step 19 (N's template run-through)]

The quick start must be the exact command list N's manual run-through proved end-to-end on a
fresh Convex deployment (launch-infra step 19). By the time this step runs, step
11 has already slimmed `README.md` to a `## Quick Start` section running `pnpm create vexcms@alpha my-site`,
`cd my-site`, and `npx convex dev`, plus a docs link for manual setup — this step swaps those
commands for whatever N's run-through actually proves; it doesn't invent commands itself.

- [ ] `README.md` quick start: the three commands from N's run-through and a link to the docs quickstart for the manual setup

#### README.md

**1 — replace the commands in the `## Quick Start` section step 11 wrote with N's proven
ones.** Whatever N's run-through proves (the same three commands step 11 left, or a shorter
set if N's work folds the Convex env wiring into the scaffold itself), swap them into the
section step 11 produced, keeping its structure:

````markdown
## Quick Start

Scaffold a complete Next.js + Convex + Vex project:

```bash
<command 1 — from N's verified run-through, launch plan item 15>
<command 2 — from N's verified run-through>
<command 3 — from N's verified run-through>
```

Open `http://localhost:3010` (or your chosen port). Sign up — the first account is automatically
promoted to admin and redirected into `/admin`.

See the [manual setup guide](https://docs.vexcms.dev/guides/quickstart/) for adding Vex to an existing Next.js + Convex app.
````

Check that `apps/docs/src/content/docs/guides/quickstart.mdx`'s own scaffold command reflects
N's proven flow too before linking to it.

Verify: the three commands, run verbatim in an empty directory against a fresh Convex
deployment, end at a signed-in admin.

### Step 18 — 0.1.0 release notes and release-day copy flip [dev] [blocked: Release (everything else shipped)]

At Release (T-1) this step does two things: apply launch-kit's reviewed `copy-flip.patch`
unchanged, and create the `v0.1.0` GitHub Release from `release-notes.md` (Design Decision 31,
cross-spec decision 2). The patch is prepared in launch-kit step 11 and reviewed in L (launch-kit
step 21). Its scope is every alpha string on an inventoried public surface: what steps 9–11 leave
behind (the README `> [!WARNING]` block and Quick Start `@alpha`, the docs `llms.txt` details
line, the www and apps/test `roadmap-stats` and `roadmap-hero` copy, the FAQ "Is it production
ready?" answer), the Hero/FAQ/HowItWorks block `defaultValue`s, `apps/www/package.json`'s
`vex:update`, the docs quickstart, the package READMEs and the templates. Nothing in this step
edits those files by hand. A post-apply `rg` hit is a gap in the patch: report it back to L
instead of fixing it here, because nothing may change after L unreviewed.

The announcement is **not** published at Release. It ships as a draft and goes live on D1 (see
the D1 note below, Design Decision 21, cross-spec decision 1).

Release notes describe what actually shipped, sourced from the changesets and CHANGELOGs
rather than hand-recalled. `.changeset/` holds 86 unreleased summaries today (pre-release
mode, `.changeset/pre.json`); `changeset version` consumes them into the package
`CHANGELOG.md`s, so re-list what's actually there at implementation time. The notes are
drafted and edited before L, which reads them against their surfaces (launch-kit step 20).

- [ ] `[agent]` `release-notes.md` drafted from `.changeset/*.md`, the package CHANGELOGs and the docs roadmap's shipped list. `[dev]` edits it before L reads it
- [ ] `[dev]` Apply the reviewed patch unchanged, then re-seed production
- [ ] `[dev]` Once changesets has published, create the `v0.1.0` GitHub Release
- [ ] `[dev]` Run the post-apply check

**Sourcing `release-notes.md`, run at implementation time (today's snapshot is stale by
release day):**

1. `ls .changeset/*.md` — today: 86 files, consumed by `changeset version` before this runs. Re-list what's left, or read the package `CHANGELOG.md` "Unreleased"/newest-version section instead once they're consumed.
2. `rg -l '\*\*Breaking' .changeset/*.md` for the breaking-change list — 20 of today's 86 carry the `**Breaking —` prefix (the project's convention; changesets here are always `patch` per P-025, so there is no semver `!` marker — breaking is prose-only, grep the text).
3. `packages/*/CHANGELOG.md` — the published entries for this release, one package at a time.
4. `apps/docs/src/content/docs/roadmap.md` "## Shipped" section (step 9's rewrite) — the public shipped list, cross-checked against the changesets above.

#### .agent/docs/specs/2026-11-06-public-presence/release-notes.md

The `gh release create --notes-file` command publishes this file verbatim — no HTML comments
or sourcing notes belong in it; replace every `TBD:` line below with real content once sourced.

```markdown
# VexCMS 0.1.0 — release notes

## Highlights

TBD: 3-6 bullets, developer-selected from the roadmap's shipped list and the non-breaking changesets.

## Breaking changes since the alphas

TBD: one line per changeset carrying the `**Breaking —` prefix — package, the change, and a
link to that package's `CHANGELOG.md` entry for the full description.

## Upgrade notes

Install from the `latest` npm tag: `pnpm add @vexcms/core@latest @vexcms/react@latest @vexcms/next@latest @vexcms/better-auth@latest @vexcms/file-storage-convex@latest` (drop any `@alpha` pins), then run `vex generate`.

## Full changelog

- [`@vexcms/core`](https://github.com/ianyimi/vex/blob/master/packages/core/CHANGELOG.md)
- [`@vexcms/react`](https://github.com/ianyimi/vex/blob/master/packages/react/CHANGELOG.md)
- [`@vexcms/next`](https://github.com/ianyimi/vex/blob/master/packages/next/CHANGELOG.md)
- [`@vexcms/cli`](https://github.com/ianyimi/vex/blob/master/packages/cli/CHANGELOG.md)
- [`@vexcms/better-auth`](https://github.com/ianyimi/vex/blob/master/packages/better-auth/CHANGELOG.md)
- [`@vexcms/file-storage-convex`](https://github.com/ianyimi/vex/blob/master/packages/file-storage-convex/CHANGELOG.md)
- [`@vexcms/richtext-plate`](https://github.com/ianyimi/vex/blob/master/packages/richtext-plate/CHANGELOG.md)
- [`create-vexcms`](https://github.com/ianyimi/vex/blob/master/packages/create-vexcms/CHANGELOG.md)
```

**Apply the copy flip (Release).** From the repo root, on the Release branch:

```bash
git apply --check .agent/docs/specs/2026-11-06-launch-kit-final-review/copy-flip.patch
git apply .agent/docs/specs/2026-11-06-launch-kit-final-review/copy-flip.patch
pnpm --filter www exec convex run seed:reinit --prod
```

`seed:reinit` (patch mode, P-021 as amended in step 10) carries the patched seed copy to the
production deployment. `apps/test` has no production deployment; its seed changes ride along in
the patch.

**Create the GitHub Release (Release, after changesets has published):**

```bash
gh release create v0.1.0 --target master --title "VexCMS 0.1.0" \
  --notes-file .agent/docs/specs/2026-11-06-public-presence/release-notes.md --latest
```

**Post-apply check.** Only a check; the patch is the edit:

```bash
rg -n "@alpha|0\.1\.0-alpha" README.md apps/docs/src/content/docs apps/docs/astro.config.mjs apps/www/convex/seed.ts apps/test/convex/seed.ts apps/www/package.json apps/www/src/vexcms/blocks apps/test/src/vexcms/blocks
```

**D1 note (not part of Release).** On D1 morning, per `2026-11-06-launch-kit-final-review/launch-kit.md`
§ Launch-morning checklist: publish `/posts/vexcms-0-1-0` from the admin; the same day, change its
seed `vex_status` to `"published"` in `apps/www/convex/seed.ts` and `apps/test/convex/seed.ts`
(so a later `seed:reinit` doesn't un-publish it) and drop its `draft: true` from `QUALITY_ROUTES`
in `apps/www/e2e/routes.ts`, in that one edit (cross-spec decisions 1 and 3). From then on the
announcement is reachable anonymously at its canonical URL.

Verify: `git apply --check` passed before the apply. `gh release view v0.1.0 --repo ianyimi/vex --json isLatest --jq .isLatest` prints
`true`. `gh api repos/ianyimi/vex/releases/latest --jq .tag_name` prints `v0.1.0`. The post-apply
`rg` returns nothing (a hit goes back to L). `curl -s -o /dev/null -w '%{http_code}' https://vexcms.dev/posts/vexcms-0-1-0` prints `404`: the announcement is still a draft at Release.

### Step 19 — Bookkeeping [agent]

The plan and the backlog stay the source of truth. This step edits them directly (cross-spec
decision 8); the text below is what it writes. The developer fills in the evidence
placeholders (spec-tasks completion counts, commit SHAs) once the other 18 steps have landed.
No "posts index page" entry: launch-kit's `/launch-week` recap page resolved it (launch-kit
handoff).

- [ ] `v0.1.0-launch-plan.md`: tick item 16 and the Q, R, O and T tasks, with evidence. The Q task's paid line and free-feature list are updated to the decided wording
- [ ] `backlog.md`: the repo transfer to `vexcms`; the inline newsletter form; `createGithubReleases: false` + one release per version; a generated sponsors image

#### .agent/docs/product/v0.1.0-launch-plan.md

**1 — tick item 16 (`v0.1.0-launch-plan.md:164-166`).** Current:

```markdown
16. [ ] **Public presence (Q + R + O + T)** — one spec, opening with Q's `dev-spec` interview
    (public commitments the rest reuse): post-0.1.0 roadmap, funding & sustainability, GitHub
    repo readiness, launch content.
```

becomes:

```markdown
16. [x] **Public presence (Q + R + O + T)** — one spec, opening with Q's `dev-spec` interview
    (public commitments the rest reuse): post-0.1.0 roadmap, funding & sustainability, GitHub
    repo readiness, launch content. (`2026-11-06-public-presence` spec-tasks: <N>/<M> done;
    `<commit sha>` <one-line summary>)
```

**2 — line 174-175, drop the tier names.** The file leaves the public repo with the rest of `.agent/` in step 15, but the plan is shared across specs and agents, so the tier names come out of the working copy too:

```markdown
Business-tier design (Pro / Agency / Enterprise, ENT-0) is post-launch and specced separately
— see `post-v0.1.0-plan.md`.
```

becomes:

```markdown
Business-tier design is post-launch and specced separately (private).
```

**3 — tick every Q task (`v0.1.0-launch-plan.md:1778-1792`) and update the paid line / free-feature
list.** Current:

```markdown
## Q — Public post-0.1.0 roadmap

### Tasks
- [ ] Write spec — `dev-spec` interview over `post-v0.1.0-plan.md`. Its free-tier tracks need re-confirming against what 0.1.0 actually shipped; the output is the public order, not a re-plan of the internal one
- [ ] Public "After 0.1.0" roadmap — free-tier work only, in order:
  1. Plugin system (Track PL) — the extension points 0.1.0 ships become a supported plugin API
  2. Free features that follow from it — FR items, first-party adapters, the TanStack Start adapter, S3 / R2, localization
  3. Brownfield adoption (Track AD) — add Vex to an existing Convex app table by table
- [ ] Paid work gets one line, no tiers and no feature list: "Paid add-ons may come later, as separate packages, after the free roadmap above. The core stays Apache-2.0 and nothing free becomes paid." Remove what is public today beyond that — the docs roadmap "Enterprise" section and the add-on list in the `apps/www` FAQ (`apps/www/convex/seed.ts:995`)
- [ ] Keep private: Pro / Agency / Enterprise tiers and their features, pricing, licence enforcement, ENT-P paperwork, maprios specifics (MW — publish as "a real Payload → Vex migration case study" or omit)
- [ ] One source of truth: `apps/docs/src/content/docs/roadmap.md`. Replace its "In progress" list (the launch track, stale the day 0.1.0 tags) with the order above; the `apps/www` roadmap block and the root `README.md` summarise it and link to it

~1 day including the spec. The internal plan stays the working document; the public page is
the commitment, kept short enough to stick to. Wording decided here is reused verbatim by R,
O, T and U. **Business-tier design (Pro / Agency / Enterprise features, ENT-0 licensing) is
not part of this** — it needs its own specs, post-launch, and is not announced until one
of them is close to shipping.
```

becomes:

```markdown
## Q — Public post-0.1.0 roadmap

### Tasks
- [x] Write spec — `dev-spec` interview over `post-v0.1.0-plan.md`. (`2026-11-06-public-presence` step 1)
- [x] Public "After 0.1.0" roadmap — free-tier work only, demand-driven (Design Decision 4; `public-copy.md` "Roadmap — after 0.1.0"):
  1. Plugin system — the extension points 0.1.0 ships (admin slots, component overrides, action contributions) become a supported plugin API
  2. Free features, as demand appears (no fixed order — 👍 the linked issue to move one up): localization, scheduled publishing, the TanStack Start adapter, a form builder, outbound webhooks, API keys and team management
  3. Brownfield adoption — add VexCMS to an existing Convex app table by table, without migrating the data it already holds
- [x] Paid work gets one line, no tiers and no feature list: "Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid." Removed from every public surface: the docs roadmap "Enterprise" section and the add-on list in the `apps/www` FAQ (step 9, step 10)
- [x] Keep private: business-tier design and pricing — see `post-v0.1.0-plan.md` (moved out of the public repo — `2026-11-06-public-presence` step 15)
- [x] One source of truth: `apps/docs/src/content/docs/roadmap.md` (step 9)

~1 day including the spec. The internal plan stays the working document; the public page is
the commitment, kept short enough to stick to. Wording decided here is reused verbatim by R,
O, T and U. **Business-tier design is not part of this** — it needs its own specs, post-launch,
and is not announced until one of them is close to shipping.

(`2026-11-06-public-presence` spec-tasks: <N>/<M> done; `<commit sha>` <one-line summary>)
```

Note S3/R2 adapters dropped from phase 2 per Design Decision 5 (omitted from every public
surface, including this internal record of the public order).

**4 — tick every R task (`v0.1.0-launch-plan.md:1798-1805`).** Flip each `- [ ]` to `- [x]`,
append one evidence line after the paragraph below the list: `(`2026-11-06-public-presence`
spec-tasks: <N>/<M> done; `<commit sha>` <one-line summary>)`.

**5 — tick every O task (`v0.1.0-launch-plan.md:1813-1832`).** Same pattern — flip each
`- [ ]` to `- [x]`, one evidence line after the paragraph that follows the list.

**6 — tick every T task (`v0.1.0-launch-plan.md:1843-1849`).** Same pattern.

#### .agent/docs/product/backlog.md

New entries appended after the file's last `---` separator, following its `## Entry format`
(What · Why · measured lift · what blocks it · why deferred · where the detail lives).

```markdown
## Repo transfer: `ianyimi/vex` → the `vexcms` org

**What.** Transfer the repository into the `vexcms` GitHub organisation (claimed, not
transferred into, by step 2 of this spec) so the repo URL matches the `@vexcms` npm scope.

**Why.** Developer decision (Design Decision 19): name protection now, transfer later, so
the move doesn't collide with unstaged telemetry work.

**Lift.** Unassessed beyond the known checklist: 9 `package.json#repository` fields point at
`git+https://github.com/ianyimi/vex.git` today (`packages/{core,react,next,cli,better-auth,
file-storage-convex,richtext-plate,create-vexcms,telemetry}/package.json`) and need the new
org slug; the Vercel git integration for `apps/www`'s deployment needs re-pointing; CI/release
secrets (`.github/workflows/release.yml`'s publish token) need re-checking under the new owner;
every changeset changelog link (`@changesets/cli/changelog`, which writes GitHub compare URLs)
needs the new URL going forward. GitHub redirects the old URL, but these four classes of
reference do not follow a redirect automatically.

**Why deferred.** `packages/cli`, `packages/create-vexcms` and `packages/telemetry` carry
unstaged telemetry work (Out of Scope, this spec) — transferring now risks those `repository`
fields drifting from what that work lands with. Out of scope for this spec per its own
Out of Scope list.

**Detail.** `2026-11-06-public-presence/spec.md` Design Decision 19 and Out of Scope.

---

## Inline newsletter form (Buttondown)

**What.** An inline Buttondown subscribe form on `apps/www` and/or the docs footer, instead
of the plain hosted-page link this spec ships (Design Decision 10).

**Why.** An inline form saves visitors a click — no navigating away to a hosted subscribe
page — but needs `form-action https://buttondown.com` added to the CSP (flagged in this
spec's Handoff to quality pass) and a `/privacy` update saying the form posts the address to
Buttondown from the site itself. The hosted-page link this spec ships needs no CSP origin and
no script; `/privacy` carries one line on it, `public-copy.md` § Release emails privacy entry
(Design Decision 9, `sources.md` §2).

**Lift.** Unassessed — a `<form>` POSTing to Buttondown's API, a CSP `form-action` directive
added in whichever spec owns the CSP by then, and an edit to the § Release emails privacy entry.

**Why deferred.** Launch day is the highest-traffic day this project will see for a while;
the hosted page (free, zero code, mandatory double opt-in) is the lower-risk choice for it.
Explicit Out of Scope item in `2026-11-06-public-presence`.

**Detail.** `2026-11-06-public-presence/spec.md` Design Decision 10 and Handoff section.

---

## Stop per-package GitHub Releases (`createGithubReleases: false`)

**What.** Set `createGithubReleases: false` on the `changesets/action` step in
`.github/workflows/release.yml:89-92`, so `changeset version`/publish stops creating one
GitHub Release per package per version (8 releases per tag today).

**Why.** `gh api repos/ianyimi/vex/releases/latest` resolves to `@vexcms/cli@0.0.20` today
because the per-package releases outnumber and outdate any single `vX.Y.Z` release — this
spec works around it by publishing a standalone `v0.1.0` Release marked `--latest` (Design
Decision 24) rather than stopping the per-package releases, so the workaround and the root
cause both exist after this ships.

**Lift.** One line in `.github/workflows/release.yml`'s `with:` block. Needs confirming
nothing downstream (dependabot, a package-specific release-notification subscriber) depends
on the per-package release objects before turning them off.

**Why deferred.** Explicit Out of Scope item in `2026-11-06-public-presence` — the fix is
small, but changing release automation is a separate, deliberate change from shipping a
stop-gap "Latest" marker.

**Detail.** `2026-11-06-public-presence/spec.md` Design Decision 24 and Out of Scope.

---

## Generated sponsors image for the README

**What.** A generated SVG/image showing current Sponsors avatars in the README (sponsorkit-
style), instead of (or alongside) the static $50/$250 name listing this spec ships (Design
Decision 8).

**Why.** Vite and tRPC both run a generated sponsors image in CI (refreshed on a schedule),
which keeps the README current without a manual edit per new sponsor; this spec's static
listing needs a hand edit each time a $50+ tier sponsor joins.

**Lift.** Unassessed — a GitHub Action that queries the Sponsors API (or runs a tool like
`sponsorkit`) and commits/caches a generated SVG, plus wiring it into the README.

**Why deferred.** Not part of the interview; the static listing is enough at zero sponsors.
Revisit once there are sponsors to show.

**Detail.** `2026-11-06-public-presence/spec.md` Design Decision 8.
```

Verify: launch plan item 16 and the Q, R, O and T task lists ticked, with commit refs; each
new backlog entry follows `backlog.md`'s entry format; `harness doctor` clean.

## Verification

- `pnpm typecheck && pnpm test && pnpm lint` green after every code step (11, 13, 14 and the `yaml` / script change in 3).
- `pnpm --filter docs build` green after steps 9, 11 and 12.
- `pnpm --filter www build` green after step 14.
- `node scripts/sync-labels.mjs --check` exits 0 after steps 3, 4 and 7. It exits 1 on a deliberate drift (negative test, step 3).
- Paid-copy sweep across every public surface (after steps 10–14, and again after step 18):
  `rg -ni "enterprise add-on|annual licen[cs]e|co-editing|single sign-on|\bSSO\b|audit log|approval workflow|branching between" README.md apps/docs/src/content/docs apps/www/convex/seed.ts apps/www/src/vexcms apps/test/convex/seed.ts .github CONTRIBUTING.md SECURITY.md` returns nothing.
- After the Release merge: `gh api repos/ianyimi/vex/community/profile --jq .health_percentage` prints `100`; the repo header shows the Sponsor button; "New issue" shows the two forms and three contact links.
