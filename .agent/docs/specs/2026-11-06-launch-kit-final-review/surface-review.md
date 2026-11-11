# Surface review — VexCMS 0.1.0 launch

> The developer's final read-through of every public surface, directly before Release (launch
> plan item 17, L). Nothing changes after step 22 except the Release version bumps and
> `copy-flip.patch`. Every row below is marked `pass` or links an `l-findings.md` row — never
> left blank.

## Review record

- Reviewed `dev` SHA: `e49d7ac3` (`e49d7ac3fbbc61c09e78e931c9effba1d57562b1`) **plus uncommitted working-tree changes** (contributor-workflow CW-1…7, DEP records, this spec's LK files). Final reviewed SHA is set after the developer commits them; step 22 re-checks against it.
- Reviewed date: 2026-11-10 (review loop opened)
- Reviewer: the developer (agent pre-pass in `l-prepass.md`)
- `vex-www` deployment for this SHA: `Production – vex-www` → success https://vex-7civae7uv-isaiah-1652.vercel.app (Production environment; no Preview deployment exists for this SHA, and none can show the uncommitted CW changes — push the committed tree to get one)
- `vex-docs` deployment for this SHA: none recorded by `gh api deployments?sha=` (docs read from the local `apps/docs/dist` build, 982 pages, `l-prepass.md` § Docs build)
- `git diff --stat <reviewed SHA>..origin/master`: n/a until the reviewed SHA is final (dev `e49d7ac3` = origin/master today)

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
| docs: 44 hand-written content files outside `api/` (20 field pages) + llms.txt. JSDoc and TypeDoc `api/**` are out of L's scope (Design Decision 25) | baseline | baseline |
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
| Starter issues (`good first issue` ×5+; the 8 `planned` issues are deleted before launch, decision 26) | public-presence · step 7; contributor-workflow | new |
| `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/config.yml`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `.github/labels.yml` (rewritten) | contributor-workflow · steps 4, 6 | new |
| docs `dev/contributing.mdx`, `dev/testing-and-code-style.mdx` (new); `dev/naming-conventions.mdx`, `dev/adding-a-field-type.mdx`, `guides/auth.mdx`, `roadmap.md` (edited) | contributor-workflow · step 5 | new |
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
| www route list (`find apps/www/src/app …`) | `api/vex/live-preview/route.ts`, `(site)/posts/[slug]/page.tsx`, `(site)/not-found.tsx` + root `not-found.tsx`, `tour/page.tsx`, `(vexcms)/admin/error.tsx`, `@auth/[...catchAll]` | yes (posts → PP-14 row; tour/error → LI-10 rows; live-preview route + not-found → www rows in step 16) |
| seeded slugs (`rg -o 'slug:…' apps/www/convex/seed.ts`) | `accessibility`, `brand`, `privacy`, `vexcms-0-1-0` (plus collection slugs `authors`, `posts`, `testimonials`) | yes |
| docs content files | 48 outside `api/`: adds `compare.mdx`, `accessibility.md`, `dev/contributing.mdx`, `dev/testing-and-code-style.mdx` (new), 4 more `dev/*` pages under the Development sidebar group | yes (Docs table below) |
| docs sidebar (`astro.config.mjs`) | `Compare`, `Accessibility`, `Development` (autogenerated `dev/`), header social links Sponsors + Release emails | yes |
| README files | `packages/create-vexcms/templates/base-nextjs/README.md` (marketing-site ships none) | yes (READMEs table) |
| GitHub | Discussions on (4 categories, pinned welcome post live); private vulnerability reporting on; 0 `planned` issues; live labels still carry `planned`, `roadmap: p0–p2`, `type: feature`, `javascript` that `labels.yml` dropped | yes (GitHub table; L-012) |
| npm | `latest` = `0.0.20`, `alpha` = `0.1.0-alpha.36` for `@vexcms/core` and `create-vexcms` | yes (matrix "version + npm dist-tag") |
| external | Sponsors, Buy Me a Coffee (`zaye`), Buttondown (`vexcms`) all 200 | yes |

## Docs (step 14)

One row per file `find apps/docs/src/content/docs -path '*/api/*' -prune -o \( -name "*.md" -o -name "*.mdx" \) -print` lists
(`l-prepass.md` §docs-inventory). The TypeDoc `api/**` pages are not reviewed (Design Decision 25).

| File | Pass | Finding |
|---|---|---|
| `accessibility.md` |  |  |
| `compare.mdx` |  |  |
| `dev/adding-a-field-type.mdx` |  |  |
| `dev/contributing.mdx` |  |  |
| `dev/naming-conventions.mdx` |  |  |
| `dev/package-layout.mdx` |  |  |
| `dev/project-structure.mdx` |  |  |
| `dev/testing-and-code-style.mdx` |  |  |
| `fields/array.mdx` |  |  |
| `fields/blocks.mdx` |  |  |
| `fields/checkbox.mdx` |  |  |
| `fields/collapsible.mdx` |  |  |
| `fields/color.mdx` |  |  |
| `fields/date.mdx` |  |  |
| `fields/email.mdx` |  |  |
| `fields/group.mdx` |  |  |
| `fields/json.mdx` |  |  |
| `fields/number.mdx` |  |  |
| `fields/relationship.mdx` |  |  |
| `fields/richtext.mdx` |  |  |
| `fields/row.mdx` |  |  |
| `fields/select.mdx` |  |  |
| `fields/tabs.mdx` |  |  |
| `fields/text.mdx` |  |  |
| `fields/textarea.mdx` |  |  |
| `fields/ui.mdx` |  |  |
| `fields/upload.mdx` |  |  |
| `fields/url.mdx` |  |  |
| `guides/access-control.mdx` |  |  |
| `guides/admin-cookies.mdx` |  |  |
| `guides/admin-customization.mdx` |  |  |
| `guides/auth.mdx` |  |  |
| `guides/caching-and-seo.mdx` |  |  |
| `guides/conditional-fields-and-masks.mdx` |  |  |
| `guides/custom-storage-adapter.mdx` |  |  |
| `guides/framework-adapters.md` |  |  |
| `guides/globals.mdx` |  |  |
| `guides/lifecycle-hooks.mdx` |  |  |
| `guides/list-views.mdx` |  |  |
| `guides/live-preview.mdx` |  |  |
| `guides/local-api.mdx` |  |  |
| `guides/pagination.mdx` |  |  |
| `guides/quickstart.mdx` |  |  |
| `guides/telemetry.mdx` |  |  |
| `guides/theming.mdx` |  |  |
| `guides/versioning-and-drafts.mdx` |  |  |
| `index.mdx` |  |  |
| `roadmap.md` |  |  |
| `llms.txt` (`apps/docs/dist/llms.txt`, details block) |  |  |

Checklist, applied per file:
- [ ] Does every code example on this page compile against today's exports? Check each imported symbol against the package's `src/index.ts` export and its signature.
- [ ] Does every internal link on the page resolve — no 404, no path left over from a rename (`l-prepass.md`'s link check covers this mechanically; re-read any 4xx or redirect-to-login row it lists for this file)?
- [ ] Does the prose describe current behavior, not a planned or removed one (cross-check against the package's current `index.ts` exports, not the page's own narrative)?

`roadmap.md`:
- [ ] Does the Shipped / After-0.1.0 (3 phases) / Not-planned grouping match `public-copy.md`'s Roadmap section verbatim, phase order included?
- [ ] Does the page carry no `planned`-issue link and no "👍 the linked issue" ask (decision 26)?
- [ ] Does the paid line match `public-copy.md`'s Paid-work line byte for byte?

`compare.mdx`:
- [ ] Is every competitor's check date within 7 days of the reviewed date? Any older date: re-verify that competitor's row against `competitors.md` and update the date before marking this row pass.
- [ ] Does every competitor cell link its cited source, and does that source still say what the cell claims?

`accessibility.md`:
- [ ] Does the stated conformance target and known-exceptions list match `backlog.md`'s current open accessibility findings — not the list as it stood when the page was drafted?

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
| base-nextjs template README (scaffolded) |  | n/a |  |

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
| `CONTRIBUTING.md` (rewritten, CW) |  |  |
| `.github/PULL_REQUEST_TEMPLATE.md` (rewritten, CW) |  |  |
| `.github/ISSUE_TEMPLATE/config.yml` (new "Contribute a fix or feature" link) |  |  |
| `SECURITY.md` (rewritten, CW) |  |  |
| `CODE_OF_CONDUCT.md` (template note removed) |  |  |
| `.github/labels.yml` vs live labels |  |  |
| workflows `ci.yml`, `pr-checks.yml`, `labeler.yml` + `.github/labeler.yml` (wording findings only; not L-editable) |  |  |
| repo metadata (description, homepage, topics) |  |  |
| community files on `dev` (read as they'll render on `master` after merge) |  |  |
| labels |  |  |
| issue forms |  |  |
| Discussions (4 categories + pinned welcome post) |  |  |
| private vulnerability reporting |  |  |
| social preview |  |  |
| starter issues (`good first issue`; no `planned` issues left) |  |  |
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
- [ ] Starter issues: does `gh issue list --label planned` print nothing (decision 26), and does every `good first issue` carry acceptance criteria a stranger could act on unprompted?
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
- [ ] Every post's funding line: does it match `public-copy.md`'s Funding section exactly, and does no post link a `planned` issue or ask for a 👍 on one (decision 26)?

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
| roadmap order (no issue links, decision 26) | `public-copy.md` § Roadmap — after 0.1.0 |  |  |  |  |  |  |  |  |
| contributor flow | `CONTRIBUTING.md` + contributor-workflow spec decisions 1, 4, 6, 7 |  |  |  |  |  |  |  |  |
| PR response window | `public-copy.md` § Pull request response window |  |  |  |  |  |  |  |  |
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
