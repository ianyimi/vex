# 04 — Business model, pricing, and monetization options

> Feeds slides: **Business model · Go-to-market · Financials/Ask (inputs)**.
> External figures: `sources/business-model-comps.md` (full citations). Internal history:
> repo paths below. Everything marked **[HYPOTHESIS]** is a proposal for the founder, not a
> decision found in the repo.

## 1. What the repo already says (monetization history)

| When | Decision / plan | Source |
|---|---|---|
| Mar 2026 | **Strategy v2:** MIT core free forever (all fields, admin, CLI, drafts, RBAC, richtext, live preview, hooks, team mgmt, API keys, scheduling, basic audit log). Paid `@vexcms/enterprise-*` packages under **BSL/commercial** in a private submodule: environments/branching, SSO, workflows, audit, localization. **Flat annual per-company licence, "$500–2000/yr range".** Plus: Convex partnership (affiliate, sponsored dev, Stack listing, acquisition/hire path), support ($500–2000/mo priority support, consulting, white-label for agencies), GitHub Sponsors/grants. Explicitly **no hosting business** ("Not charging for hosting"). | `.agent/docs/research/legacy-planning/roadmap-monetization-strategy-v2.md:18-97`, `:190` |
| Mar 2026 | Environments named "the primary enterprise moat … nothing in the Convex ecosystem competes" | same file `:465-473`, `:627` |
| Aug 2026 | **Relicensed MIT → Apache-2.0** (decision D9). FSL considered and rejected (not OSI, not SPDX, would contradict public promises). "With Apache-2.0 that tier [BSL enterprise] remains a live design question." | `.agent/docs/specs/2026-08-30-launch-readiness/spec.md:407-457` |
| Sep 2026 | **No `/pricing` page** — "Nothing is for sale"; "pricing implies a product that isn't for sale" | `.agent/docs/specs/2026-09-01-www-content-spec/spec.md:146`; launch-readiness `:834-835` |
| Live site | Public promise: "The core is Apache-2.0 and stays that way … Paid enterprise add-ons come later: environment branching, SSO, approval workflows, audit logs, and localization, as separate packages under a flat annual licence. **Nothing free today becomes paid later.**" | `apps/www/convex/seed.ts:989`; roadmap item "Enterprise Add-Ons — exploring" `seed.ts:1523-1526` |
| Sep 2026 | Versioning designed as an append-only DAG so **enterprise content branching** is additive later; **git one-way mirror** assessed as "a real enterprise selling point" (audit, PR-style review, exit path, DR) | `.agent/docs/product/backlog.md:548-693` |
| Aug 2026 | **Analytics adapter** idea: per-document/per-block metrics inside the admin; "BaseHub markets analytics as a differentiator" | launch-readiness spec `:1076-1090` |

**Gap:** there is no current, canonical business-model doc — the only full plan is in
`legacy-planning/` (marked "not current plans") and predates the Apache-2.0 switch, the
Payload→Figma and BaseHub→Vercel acquisitions, and Convex's Apr 2026 Business plan.
See § 6 for where to add one.

## 2. What the market says (pricing anchors)

All from `sources/business-model-comps.md` (accessed 2026-10-12).

| Comparable | Paid unit | Price | Enterprise features in that tier |
|---|---|---|---|
| Sidekiq (solo founder, LGPL core) | flat licence | Pro **$995/yr**; Enterprise from **$269/mo** | commercial licence + advanced features; **$13.5M cumulative sales in 10 yrs, 1 employee** |
| Directus | flat per org | Team **$499/mo ($5,988/yr)**; Enterprise custom; free for orgs <$5M revenue & <50 staff | SSO only from Team; SCIM/offline Enterprise |
| Strapi | per project + seats | Growth $45/mo +$15/seat; SSO add-on $150/mo +$50/seat; Enterprise custom | review workflows, audit logs, SSO = Enterprise |
| Payload (Figma) | sales-quoted | Enterprise custom (SSO, publishing workflows, visual editor, A/B) | Payload Cloud paused new deployments post-acquisition |
| Sanity | per seat + usage | Growth $15/seat/mo; Enterprise custom | SSO, audit trail, custom roles = Enterprise |
| Storyblok | tiered | self-serve up to $349/mo w/o SSO; Premium/Elite custom | environments, custom workflows, SSO = Premium+ |
| Convex itself | platform | Pro $25/dev/mo; **Business $2,500/mo minimum** | SSO, SIEM audit logs (`sources/convex-ecosystem.md` §4) |
| AG Grid / react-admin | per developer | AG Grid Enterprise $999/dev/yr; react-admin EE from €145/mo | — |

**Takeaways**

1. The repo's **$500–2,000/yr** anchor is at or below the *cheapest* comparable (Sidekiq Pro
   $995/yr) and 3–30× below CMS comparables. Convex customers who need SSO already pay Convex
   **$30,000/yr** minimum for it. **[HYPOTHESIS]** Re-anchor (see § 4).
2. Every CMS comp bundles **SSO + audit log + approval workflows** into one gated tier —
   matches the planned package list exactly. GitLab's "buyer-based open core" (tier by *who
   buys*, not build cost) is the citable rationale.
3. Hosting and licensing are **separate revenue lines** where both exist (Strapi, Directus).
   Ghost is 100% hosting ($11.1M ARR, live dashboard).
4. **Founder decision (2026-10-12): no hosting and no cloud/managed features, ever.** VexCMS
   will not run anything in customers' production paths. Every paid feature ships as
   self-hosted code running in the customer's own Convex deployment (BYO keys for AI,
   email, CDN). This also avoids Convex's FSL "Competing Use" question entirely
   (`sources/business-model-comps.md` §3.2). Pitch line: "zero infrastructure, near-100% margin licences."

## 3. Revenue streams — options ranked for the deck

| # | Stream | Fit | Evidence | Notes |
|---|---|---|---|---|
| 1 | **Tiered self-hosted licences — Pro · Agency · Enterprise** (Pro: co-editing, visual editor, basic A/B; Agency: Pro + client-project coverage + white-label; Enterprise: SSO/SCIM, audit log, approval workflows, branching, git mirror, SLA, procurement terms). Localization and presence stay free (founder decision 2026-10-17) | Already promised publicly | seed.ts:995; comps § 2; § 4 below | Core of the model. Licence options for the private packages: commercial EULA, BSL, or FSL (Convex's own choice). Decide in an ADR |
| 2 | **Convex partnership**: ecosystem listing, Startups-program bundling, co-marketing, sponsored development; long-term acquisition path | Strong. Convex has stated it wants Components to become "a real marketplace" | `sources/convex-ecosystem.md` §3, partnership-asks table | Not revenue on day 1; strategic. Do not model referral revenue until Convex publishes terms (none found) |
| 3 | **Agency tier** (now a priced licence, § 4): client-project coverage, white-label admin, licence handoff, partner directory | Agencies are a named target user | old mission; strategy v2 Tier 4 | Agencies are the bridge from free installs to enterprise buyers; the licence covers clients only below the Pro size cap |
| 4 | **Migration tooling / services**: Payload→Vex, BaseHub→Vex | Timely: BaseHub's future is "nothing changes for now" after Vercel; Payload Cloud paused | `sources/competitors.md`; BaseHub blog 2026-06-02 | A productized importer is an acquisition channel; one-off services bring early cash (no ongoing ops) |
| 5 | **Support/SLA subscriptions** (code support, not operations) | Standard | strategy v2 Tier 4 | Founder-time-bound; low scale |
| 6 | **Premium templates/blocks** (one-time) | Medium | Tailwind UI model | Fits the `create-vexcms` marketing-site template; small revenue, good funnel |
| 7 | Sponsors / grants | Non-dilutive runway | GitHub Accelerator $40K, Secure OSS Fund $10K, NLnet €5–50K, Convex for Startups credits | See `sources/business-model-comps.md` §5 |

**Explicitly excluded:** hosting, managed deployments, and any cloud or usage-metered service
(founder decision, 2026-10-12; matches strategy v2: "Not charging for hosting").

**Constraint from the public promise:** "Nothing free today becomes paid later." Anything
shipped free (drafts, live preview, hooks, RBAC, localization, presence) cannot later move
behind the licence. Decide the free/paid line for planned BaseHub-inspired features
**before** they ship (see `03-competition.md` § BaseHub feature matrix).

## 4. Pricing — founder target (decided 2026-10-17; not yet market-validated)

Per company, **never per seat**, priced by company size/revenue. Renewing customers keep the
price they signed at (grandfathered while renewals continue); no pay-once licences. Paid tiers
ship in price order: Pro → Agency → Enterprise, and Enterprise cannot ship until its
procurement paperwork exists (`.agent/docs/product/post-v0.1.0-plan.md` decisions 10–13).

| Tier | Who | End-state list price | Contents |
|---|---|---|---|
| Community | everyone | Free, Apache-2.0 | Entire core incl. localization, presence/facepile, drafts, RBAC, live preview, hooks |
| Pro | companies under ~$5M revenue / ~25 staff | **$995/yr** flat | Co-editing (cursors, per-field indicators, conflict resolution, collaborative rich text), visual editor, basic A/B testing, email support |
| Agency | agencies building for clients under the Pro cap | **$2,500/yr** flat | Pro + unlimited client projects, white-label admin, licence handoff, partner directory |
| Enterprise | companies above the cap, or needing compliance | **$9,500 / $18,000 / $30,000 per year** by size band (≤250 / 250–1,000 / 1,000+ staff) | Agency + SSO/SCIM, audit log, approval workflows, branching, git mirror, full A/B + personalization, support SLA, MSA with capped indemnity, security-questionnaire pack, invoicing on terms |

Anchors: Sidekiq Pro $995/yr; Directus Team ~$6k/yr self-hosted; Strapi Enterprise
reportedly $15–50k/yr (unverified); Convex Business $30k/yr minimum, which Enterprise buyers
already pay (`sources/business-model-comps.md`).

**Launch ramp** — founding prices for new customers rise as each tier gains features:

| Tier | Year 1 | Year 2 | Year 3 | Year 4+ |
|---|---|---|---|---|
| Pro | $295 | $595 | $995 | $995 |
| Agency | — | $1,250 | $2,000 | $2,500 |
| Enterprise (≤250 band; larger bands ×1.9 / ×3.2) | — | $5,000 | $7,500 | $9,500 |

**Licence mechanics:** private-registry install tokens plus an Ed25519-signed offline key
checked by the CLI at `vex dev` / `vex deploy`. No phone-home; lapsed licences warn, then
block *deploying* paid packages after a signed grace date — running production never breaks.

## 5. Revenue model — five-year scenarios (every input is an `[ASSUMPTION]`)

**Model:** yearly signup cohorts, each renewing at its locked price; annual churn Pro 20%,
Agency 15%, Enterprise 10%; Enterprise band mix 70/22/8% (blended list ≈ $13.1k/yr). Year 1
= first year Pro is on sale; Agency and Enterprise start in year 2.

**Conservative** — new/yr: Pro 20→100 · Agency 3→12 · Enterprise 1→7

| Year | Pro ARR | Agency ARR | Enterprise ARR | Total ARR | Customers (P/A/E) |
|---|---|---|---|---|---|
| 1 | $6k | $0 | $0 | $6k | 20 / 0 / 0 |
| 2 | $29k | $4k | $7k | $39k | 56 / 3 / 1 |
| 3 | $83k | $15k | $37k | $135k | 105 / 9 / 4 |
| 4 | $146k | $38k | $99k | $282k | 164 / 17 / 9 |
| 5 | $216k | $62k | $180k | $458k | 231 / 27 / 15 |

**Base** — new/yr: Pro 50→350 · Agency 8→35 · Enterprise 3→22

| Year | Pro ARR | Agency ARR | Enterprise ARR | Total ARR | Customers (P/A/E) |
|---|---|---|---|---|---|
| 1 | $15k | $0 | $0 | $15k | 50 / 0 / 0 |
| 2 | $83k | $10k | $21k | $114k | 160 / 8 / 3 |
| 3 | $266k | $39k | $101k | $405k | 328 / 22 / 11 |
| 4 | $491k | $95k | $287k | $873k | 542 / 44 / 25 |
| 5 | $741k | $168k | $545k | $1.45M | 784 / 72 / 44 |

**Strong** — new/yr: Pro 100→900 · Agency 20→80 · Enterprise 6→50

| Year | Pro ARR | Agency ARR | Enterprise ARR | Total ARR | Customers (P/A/E) |
|---|---|---|---|---|---|
| 1 | $30k | $0 | $0 | $30k | 100 / 0 / 0 |
| 2 | $202k | $25k | $41k | $268k | 380 / 20 / 6 |
| 3 | $659k | $101k | $223k | $983k | 804 / 57 / 23 |
| 4 | $1.22M | $236k | $657k | $2.12M | 1,343 / 108 / 56 |
| 5 | $1.87M | $401k | $1.24M | $3.52M | 1,975 / 172 / 100 |

Grandfathering (locked prices vs list) peaks in year 3 at $42k / $115k / $265k and falls to
~5–6% of ARR by year 5 in every scenario, because founding pricing is limited to early cohorts.

**Mix sensitivity** (ARR at list, by total customers; Pro/Agency/Enterprise share):

| Customers | Pro-heavy 90/7/3 | Balanced 80/12/8 | Enterprise-leaning 70/15/15 |
|---|---|---|---|
| 100 | $146k | $214k | $303k |
| 250 | $366k | $535k | $757k |
| 500 | $731k | $1.07M | $1.51M |
| 1,000 | $1.46M | $2.14M | $3.03M |
| 2,000 | $2.92M | $4.28M | $6.06M |

Blended revenue per customer: $1.46k (Pro-heavy) · $2.14k (balanced) · $3.03k
(Enterprise-leaning).

**Beachhead ceiling (replaces the earlier $0.7–7.3M):** Convex paying teams ≈ 10,000
(Convex, 2026-04-02) → `[ASSUMPTION]` 73% in market ≈ 7,300 → `[ASSUMPTION]` 5–10% paid
conversion × $1.46–3.03k blended ⇒ **≈ $0.53M–$2.2M ARR** at today's Convex size. The earlier
figure assumed every paying customer spent $2–10k (enterprise-only pricing); the tiered model
sells most seats at Pro prices and earns most of its upside from Enterprise mix.

- Sanity check against Sidekiq: a solo, flat-licence OSS business reached ~$1.35M/yr average
  gross sales over 10 years with 1,850 customers (~$730/customer).
- Upside drivers: Convex growth (`convex` npm downloads 12.2× YoY; ~500k developers,
  ~2M apps per Convex Series B release, 2026-08-04), Enterprise mix, plus non-Convex
  expansion if the framework-agnostic core later supports other backends (SpacetimeDB
  assessed: `.agent/docs/research/spacetimedb-vs-convex-port-feasibility.md`).
- Costs outside the model: Stripe ~3%, private registry $0–100/mo, MSA/licence lawyer
  $3–10k one-time, tech E&O insurance ~$1–3k/yr once Enterprise sells, and founder support
  time (grows with Enterprise SLAs).

## 6. Where to add business-model material in the repo (suggestions)

| Add | Path | Why |
|---|---|---|
| Canonical business model (supersedes legacy v2) | `.agent/docs/product/business-model.md` | `roadmap.md:80-96` still points at the legacy file; investors will ask for one current answer |
| ADR: open-core boundary + enterprise licence | `.agent/docs/decisions/ADR-015.md` | Records free/paid line, licence for enterprise packages (commercial/BSL/FSL), and the "nothing free becomes paid" constraint |
| Pricing hypotheses + validation log | `.agent/docs/product/pricing-hypotheses.md` | Track design-partner conversations and willingness-to-pay evidence |
| Metrics definitions | `.agent/docs/product/metrics.md` | See `07-gaps-and-asks.md` § metrics |
| Public `/pricing` page | `apps/www` (deferred by design today) | Only once one paid item exists; a "Enterprise — talk to us" waitlist is a cheap demand test |
