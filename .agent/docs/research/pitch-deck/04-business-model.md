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
| 1 | **Enterprise add-on licence** (branching/environments, SSO, approval workflows, audit + retention, localization, git mirror; optionally analytics and AI features that run on the customer's own deployment with their own API keys) | Already promised publicly | seed.ts:989; comps § 2 | Core of the model. Licence options for the private packages: commercial EULA, BSL, or FSL (Convex's own choice). Decide in an ADR |
| 2 | **Convex partnership**: ecosystem listing, Startups-program bundling, co-marketing, sponsored development; long-term acquisition path | Strong. Convex has stated it wants Components to become "a real marketplace" | `sources/convex-ecosystem.md` §3, partnership-asks table | Not revenue on day 1; strategic. Do not model referral revenue until Convex publishes terms (none found) |
| 3 | **Agency program**: white-label admin, multi-client licence, certified partner directory | Agencies are a named target user | old mission; strategy v2 Tier 4 | Agencies are the bridge from free installs to enterprise buyers |
| 4 | **Migration tooling / services**: Payload→Vex, BaseHub→Vex | Timely: BaseHub's future is "nothing changes for now" after Vercel; Payload Cloud paused | `sources/competitors.md`; BaseHub blog 2026-06-02 | A productized importer is an acquisition channel; one-off services bring early cash (no ongoing ops) |
| 5 | **Support/SLA subscriptions** (code support, not operations) | Standard | strategy v2 Tier 4 | Founder-time-bound; low scale |
| 6 | **Premium templates/blocks** (one-time) | Medium | Tailwind UI model | Fits the `create-vexcms` marketing-site template; small revenue, good funnel |
| 7 | Sponsors / grants | Non-dilutive runway | GitHub Accelerator $40K, Secure OSS Fund $10K, NLnet €5–50K, Convex for Startups credits | See `sources/business-model-comps.md` §5 |

**Explicitly excluded:** hosting, managed deployments, and any cloud or usage-metered service
(founder decision, 2026-10-12; matches strategy v2: "Not charging for hosting").

**Constraint from the public promise:** "Nothing free today becomes paid later." Anything
shipped free (drafts, live preview, hooks, RBAC, presence if shipped free) cannot later move
behind the licence. Decide the free/paid line for planned BaseHub-inspired features
**before** they ship (see `03-competition.md` § BaseHub feature matrix).

## 4. Pricing hypothesis to put in the deck  **[HYPOTHESIS — founder to validate]**

Anchored to cited comps; do not present as validated.

| Tier | Who | Price shape | Anchor |
|---|---|---|---|
| Community | everyone | Free, Apache-2.0 | Payload/Strapi/Directus core |
| Team / Pro licence | startups & agencies on Convex Pro | flat ~$1–3k/yr per company (or per agency client project) | Sidekiq Pro $995/yr; Strapi SSO add-on ≈ $1.8k/yr + seats |
| Enterprise licence | companies on Convex Business/Enterprise | flat ~$10–30k/yr per company, sales-assisted | Directus Team $6k/yr; Convex Business $30k/yr floor; Contentful median deal $24–54k/yr (Vendr, unverified primary) |
| Support / SLA (optional) | enterprise buyers | annual add-on | strategy v2 Tier 4 |

Free-tier eligibility idea: Directus-style "free for orgs under $X revenue" keeps
startups/agencies on the funnel while enterprises pay.

## 5. Illustrative revenue math (inputs cited, assumptions flagged)

From `sources/market-size.md` §6 (bottom-up):

- Convex paying teams ≈ 10,000 (Convex, 2026-04-02) → `[ASSUMPTION]` 73% in market for a
  headless CMS (WP Engine adoption rate) ≈ 7,300 → `[ASSUMPTION]` 5–10% conversion at
  $2–10k/yr ⇒ **≈ $0.7M–$7.3M ARR** beachhead.
- Sanity check against Sidekiq: a solo, flat-licence OSS business reached ~$1.35M/yr average
  gross sales over 10 years with 1,850 customers.
- Upside drivers: Convex growth (`convex` npm downloads 12.2× YoY; ~500k developers,
  ~2M apps per Convex Series B release, 2026-08-04), plus non-Convex expansion if the
  framework-agnostic core later supports other backends (SpacetimeDB assessed:
  `.agent/docs/research/spacetimedb-vs-convex-port-feasibility.md`).

## 6. Where to add business-model material in the repo (suggestions)

| Add | Path | Why |
|---|---|---|
| Canonical business model (supersedes legacy v2) | `.agent/docs/product/business-model.md` | `roadmap.md:80-96` still points at the legacy file; investors will ask for one current answer |
| ADR: open-core boundary + enterprise licence | `.agent/docs/decisions/ADR-015.md` | Records free/paid line, licence for enterprise packages (commercial/BSL/FSL), and the "nothing free becomes paid" constraint |
| Pricing hypotheses + validation log | `.agent/docs/product/pricing-hypotheses.md` | Track design-partner conversations and willingness-to-pay evidence |
| Metrics definitions | `.agent/docs/product/metrics.md` | See `07-gaps-and-asks.md` § metrics |
| Public `/pricing` page | `apps/www` (deferred by design today) | Only once one paid item exists; a "Enterprise — talk to us" waitlist is a cheap demand test |
