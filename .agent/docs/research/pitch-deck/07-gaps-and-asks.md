# 07 — Gaps, founder questions, and what to add before pitching

> These are the items a deck builder will need that the repo and public sources cannot
> answer. Each item says where the answer should go.

## A. Questions only the founder can answer (blocking for the deck)

| # | Question | Needed for slide | Where to record |
|---|---|---|---|
| 1 | Founder bio: background, prior roles, why you for this problem, full-time or part-time | Team | `.agent/docs/product/team.md` (new) |
| 2 | What is maprios, and what is your relationship to it? Is it your company, a client, or an employer? How many users or editors would the migration put on VexCMS? | Traction (design partner) | `.agent/docs/product/mission.md` |
| 3 | What happened at the 2026-03-27 developer event, the 2026-09-02 Convex meetup, and the Discord post? Who reached out? Any Convex staff feedback or intros? | Traction, Platform | `.agent/docs/product/traction-log.md` (new) |
| 4 | How many people outside the project have scaffolded or deployed VexCMS? Any issues, PRs, DMs, or testimonials? | Traction | traction-log |
| 5 | The raise: amount, instrument (SAFE or priced), timeline, 18–24-month milestones it buys | Ask / Use of funds | `.agent/docs/product/fundraising.md` (new) |
| 6 | Co-founder or first-hire plans (solo-founder risk is the first seed question) | Team | team.md |
| 7 | ~~Free vs paid for BaseHub features?~~ **Mostly answered 2026-10-17:** localization, presence/facepile free; co-editing, visual editor, basic A/B → Pro; SSO/SCIM, audit, approvals, branching → Enterprise (`03-competition.md` matrix). Open: analytics, AI, MCP | Roadmap, Business model | `roadmap.md` + open-core ADR |
| 8 | ~~Hosted control plane?~~ **Answered 2026-10-12: no hosting or cloud features.** Remaining question: which BaseHub-style features (analytics, AI) go in the enterprise licence vs free, given they run on the customer's own deployment | Business model | ADR-015 |
| 9 | ~~Pricing anchor?~~ **Answered 2026-10-17:** Community free · Pro $995/yr · Agency $2,500/yr · Enterprise $9.5k / $18k / $30k by size band; per company, never per seat; renewal-locked grandfathering (`04-business-model.md` §4) | Business model | `pricing-hypotheses.md` (validation log) |
| 10 | The 10-year vision: the CMS for Convex only, or content infrastructure for reactive backends in general? | Vision | `mission.md` |

## B. Metrics to start collecting now

Current numbers are weak or noisy (`06-traction-roadmap-team.md`). Investors in OSS devtools
look first at **GitHub star growth rate** (Runa ROSS Index methodology,
`sources/business-model-comps.md` §4.2).

| Metric | How | Note |
|---|---|---|
| GitHub stars / week, forks, external contributors | GitHub API snapshot weekly into the traction log | Today: 8 stars, 1 fork |
| Unique scaffolds per week | Opt-in anonymous ping from `create-vexcms` | Needs consent and a privacy note. The www spec already says a privacy page is required if analytics is switched on (`.agent/docs/specs/2026-09-01-www-content-spec/spec.md:147`) |
| Site and docs traffic + referrers | Vercel Analytics, as already recommended in launch-readiness WP-7 (`spec.md:1049-1054`) | Shows which channels work (Convex Discord, Stack, X) |
| Live deployments | Count of "built with VexCMS" sites you know of; a showcase page | Social proof |
| Design-partner pipeline | Names, stage, blocker features | Converts to logos/quotes for the deck |
| Enterprise interest | "Enterprise add-ons — join waitlist" form | Cheap willingness-to-pay test without a `/pricing` page |
| npm downloads with caveat | Report only alongside the CI/publish caveat | Today's ~1k/month per package is mostly CI and scaffold verification |

## C. Milestones that would make the deck much stronger (suggested order)

1. **Ship v0.1.0** with drafts/versioning and richtext. These are the two gaps a CMS evaluator notices first (`apps/www/convex/seed.ts:979`).
2. **Complete the maprios migration** off Payload/MongoDB and write it up as a case study with before/after (ops removed, real-time gained, LOC or cost).
3. **3–5 external design partners**, ideally Convex Business-plan teams or agencies.
4. **Convex ecosystem placement**: a Stack guest post, a template listing, or a startups-program mention (`05-platform-convex.md` § asks).
5. **A BaseHub-parity "wow" feature**: presence/facepile (cheap on Convex, per `backlog.md:323-404`) or a branching preview.
6. **A 90-second demo video** following the original event demo flow (`01-problem-solution-product.md` § Demo assets).
7. **Waitlist signups per tier** (Pro / Agency / Enterprise) as early willingness-to-pay evidence, then the first founding-price Pro customers ($295/yr cohort, `04-business-model.md` §4).

## D. Risks to pre-empt in the deck (with the counter-evidence to show)

| Risk an investor will raise | Counter |
|---|---|
| Solo founder | Velocity evidence (6-week prototype, 40 npm versions, 14 ADRs, ~1.9k tests) plus a hiring plan (A6) |
| Platform dependency on Convex | `05-platform-convex.md` § Platform risk |
| Pre-traction | Ecosystem timing (`02-market-why-now.md`) and a dated design-partner plan (C3) |
| Both named competitors were acquired. Does that cap outcomes? | Acquisitions show buyers exist (Figma, Vercel, Salesforce ~$1.5B for Contentful). Deal values for Payload and BaseHub are undisclosed, so don't imply a price |
| "Just use Payload" | Payload Cloud is paused, Payload has no real-time, and it needs a DB you operate. On Convex, VexCMS is the native option (`03-competition.md`) |
| The rebuild (Apr 2026) reset the feature set | Present it as "prototype validated → production foundation". The rebuild has already re-shipped RBAC, live preview, hooks, and globals |
| The Apache-2.0 promise limits monetization | The site and roadmap already commit to the open-core boundary. Sidekiq, Directus, and Strapi show paid add-ons on a free core work (`04-business-model.md` § 2) |

## E. Use of funds: template only, amounts are founder decisions

Benchmarks: YC $500k standard deal; median seed ~$4M round and ~$16M pre-money (2025, Carta
via secondary source); 90%+ of early rounds are SAFEs (`sources/business-model-comps.md` §4–5).

| Bucket | What it buys (from the repo roadmap) |
|---|---|
| Engineering (1–2 hires) | v0.1.0 finish, Pro tier (co-editing, visual editor, A/B), branching (Enterprise), TanStack Start adapter |
| Developer relations / community | Convex ecosystem content, templates, docs, design-partner support, agency partner program |
| Paid-tier infrastructure | Private package registry, signed licence keys, Stripe invoicing; Enterprise packaging (SSO/SCIM, audit, workflows) |
| Enterprise readiness | MSA with capped indemnity (lawyer), support SLA, security-questionnaire / trust pack, E&O insurance |
| Runway | 18–24 months to the next milestone set (seed→A median is ~2.1 years) |

## F. Repo additions suggested (summary)

`.agent/docs/product/business-model.md` · `.agent/docs/product/pricing-hypotheses.md` ·
`.agent/docs/product/metrics.md` · `.agent/docs/product/traction-log.md` ·
`.agent/docs/product/team.md` · `.agent/docs/product/fundraising.md` ·
`.agent/docs/decisions/ADR-015.md` (open-core boundary and enterprise licence) ·
update `roadmap.md` § Long-term vision to point at `business-model.md` instead of `legacy-planning/`.
