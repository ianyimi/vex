# VexCMS — Business Model & Market Research Dossier

Compiled 2026-10-12. All figures carry inline citation + as-of date. Aggregator figures are flagged as such where no primary source was found.

---

## 1. Open-core / commercial-OSS monetization comparables

### 1.1 Summary table — model, gate, pricing

| Company | Core license | What's free | What's paid / how gated | Current price (as of date) | Source |
|---|---|---|---|---|---|
| **Payload CMS** | MIT (fully open) | Entire CMS, self-hosted, unlimited | **Payload Cloud** (managed hosting, now paused post-acquisition) + **Enterprise** (SSO, AI auto-embedding, approval/publishing workflows, visual editor, A/B testing) via sales | Cloud: Standard ~$35–45/mo, Pro ~$199/mo, Enterprise Cloud "custom," third-party estimate ~$10,000/yr+ annual commitment; Enterprise self-hosted is sales-quoted | [payloadcms.com/cloud-pricing](https://payloadcms.com/cloud-pricing) (2026-10); [payloadcms.com/enterprise](https://payloadcms.com/enterprise) (2026-10); third-party estimate [efficient.app](https://efficient.app/apps/payload) (2026, unverified primary) |
| **Strapi** | MIT (Community) | Unlimited content-types, locales, roles, self-hosted | **Growth** ($45/mo + $15/seat, AI/live preview/releases) and **Enterprise** (SSO, review workflows, audit logs, SOC2) license tiers, sold separately from **Strapi Cloud** hosting | Growth $45/mo (3 seats incl., +$15/seat); SSO add-on $150/mo (+$50/seat); Enterprise "custom." Cloud: Starter $35/mo·project, Pro $90/mo, Business $450/mo | [strapi.io/pricing-cms](https://strapi.io/pricing-cms) (2026-10); [strapi.io/pricing-cloud](https://strapi.io/pricing-cloud) (2026-10) |
| **Directus** | **MSCL 1.0** (Monospace Sustainable Core License, derived from Fair Core License; was BSL 1.1 for ~3 yrs before Apr 2026 change) — converts to GPLv3 after 4 years | Self-hosted "Core" tier (3 seats, 25 collections) free; full platform free for orgs **under $5M revenue AND <50 employees** via "Open Innovation Grant" (1,000+ keys issued) | **Team** ($499/mo annual or $599/mo monthly — 10 SSO seats, 50 collections) and **Enterprise** (custom — SCIM, offline mode, custom LLM) gate SSO/SCIM/offline entirely; SSO unavailable on Core at any price | Team $499/mo ($5,988/yr) or $599/mo monthly; Core $0; Cloud hosting add-on $99/mo (Core/Team) | [directus.com/pricing](https://directus.com/pricing) (2026-10); [directus.com/resources/directus-v12-license-change](https://directus.com/resources/directus-v12-license-change) (2026-04-22, re-fetched 2026-10-09) |
| **Sanity** | Open-source Studio (React editor) + proprietary hosted Content Lake | Free tier: 20 seats, 2 datasets, 10k docs | **Growth** ($15/seat/mo) adds private datasets, comments/tasks, AI Assist; **Enterprise** (custom) adds SSO/SAML, audit log, custom roles, uptime SLA | Growth $15/seat/mo; add-ons: Dedicated Support +$799/mo, extra dataset +$999/mo; Enterprise custom (third-party estimate ~$193,620/yr avg, unverified primary) | [sanity.io/pricing.md](https://www.sanity.io/pricing.md) (2026-10); SSO premium corroborated independently by [sso.tax](https://sso.tax/) — Sanity base $15/u/mo → SSO tier $70.96/u/mo (+373%), updated 2024-01-23 |
| **Ghost** | MIT (fully open) | Entire platform, self-hosted | **Ghost(Pro)** managed hosting only — no feature-gated enterprise tier; monetization is 100% hosting, run by a non-profit foundation | N/A (pricing not pulled; business model is the point) | [ghost.org/about](https://ghost.org/about) (live dashboard, accessed 2026-10-12) |
| **PostHog** | MIT core + "ee/" (PostHog Enterprise license, source-available) for a few enterprise features | Generous usage-based free tier across all products (1M events/mo free etc.), self-hosting of MIT core | Paid = pure usage-based consumption pricing, not a feature-gated tier; "PostHog Enterprise" license covers a small set of self-host-only features (e.g., project-level permissions) but cloud customers get everything via usage billing — PostHog explicitly rejected "talk to sales" gating | Pay-as-you-go, e.g., product analytics $0.00005–0.000009/event depending on volume; no per-seat charge | [posthog.com/pricing](https://posthog.com/pricing) (2026-10); [posthog.com/blog/transparent-enterprise-pricing](https://posthog.com/blog/transparent-enterprise-pricing) |
| **Cal.com** | AGPLv3 (self-hosted) + commercial license for orgs that don't want AGPL obligations | Free forever (1 user); self-host under AGPL | **Teams** ($12/user/mo), **Organizations** ($28/user/mo — SAML SSO, SCIM, SOC2/HIPAA/ISO27001), **Enterprise** (custom — dedicated DB, HRIS integrations); separate paid **self-hosted commercial license** to avoid AGPL copyleft | Teams $12/user/mo (annual); Organizations $28/user/mo (annual); self-host commercial license sales-quoted | [cal.com/pricing](https://cal.com/pricing) (2026-10); [cal.com Self-Hosted Commercial License](https://i.cal.com/sales/commercial-license) |
| **Supabase** | Apache 2.0 core (mostly) | Free: 50k MAU, 500MB DB, 2 projects | **Pro** ($25/mo + compute), **Team** ($599/mo — SOC2/ISO27001, SSO for dashboard, HIPAA add-on), **Enterprise** (custom — uptime SLA, PrivateLink) — monetization is almost entirely **hosted-cloud usage billing**, not a license fee | Pro from $25/mo; Team from $599/mo; SSO (SAML) is a Team-exclusive feature (not available on Pro at any price) — a clear SSO-tax example | [supabase.com/pricing.md](https://supabase.com/pricing.md) (2026-10) |
| **Plausible Analytics** | AGPLv3 | Fully self-hostable, free | Plausible Cloud hosted subscription; bootstrapped, no VC | Hosted from ~$14/mo per [sso.tax](https://sso.tax/) entry (2025-11-06); SSO is "Call Us" (quotes-required) | **Revenue (self-reported):** $1M ARR by mid-2022 — [plausible.io/blog/open-source-saas](https://plausible.io/blog/open-source-saas) (2022-06-22); **$3.1M ARR** per third-party aggregator — [getlatka.com/companies/plausible-analytics](https://getlatka.com/companies/plausible-analytics) (unverified primary, 2024 figure) |
| **GitLab** | Open-core; Community Edition (MIT) vs. proprietary Premium/Ultimate | Free tier (self-managed or GitLab.com, 5 users) | **Premium** ($29/user/mo annual) and **Ultimate** (custom) — GitLab explicitly uses a **"Buyer-Based Open Core"** philosophy: features are tiered by *which persona buys them* (e.g., a security feature a CISO buys goes in Ultimate even if cheap to build), not by cost-to-build | Premium $29/user/mo (billed annually $348/yr); Ultimate custom | [about.gitlab.com/pricing](https://about.gitlab.com/pricing/) (2026-10); methodology: [about.gitlab.com/blog/five-ways-resist-service-wrapping-buyer-based-open-core](https://about.gitlab.com/blog/five-ways-resist-service-wrapping-buyer-based-open-core) |
| **Sidekiq** | LGPLv3 core | Free background-job framework for Ruby | **Pro** ($99/mo or $995/yr) and **Enterprise** (from $269/mo, scales per-thread) — paid tiers also convert the license from LGPL to a commercial license, avoiding legal exposure for buyers | Pro $995/yr; Enterprise from $269/mo | [sidekiq.org/products/enterprise](http://sidekiq.org/products/enterprise) (synced 2026-06-10) |
| **Tailwind Plus** (ex-Tailwind UI) | Tailwind CSS itself is MIT/free | Tailwind CSS framework free forever | Tailwind Plus (UI kit/templates) is a **one-time purchase**, not subscription | Personal $299, Team (≤25 people) $979, one-time, lifetime updates — **acquired by Shopify Sept 9, 2026; stopped accepting new customers same day** | [tailwindcss.com/blog/tailwind-plus](https://tailwindcss.com/blog/tailwind-plus); acquisition: [untitledui.com/blog/tailwind-plus-alternatives](https://www.untitledui.com/blog/tailwind-plus-alternatives) (2026) |
| **Laravel** | MIT framework | Full framework free | **Forge** (server mgmt, from $12/mo), **Vapor** (serverless deploy, $39/mo), **Nova** (admin panel, paid package) — a *constellation* of separate paid products around a free framework, not a single "enterprise tier" | Forge Hobby $12/mo; Vapor $39/mo + AWS costs | [forge.laravel.com](https://forge.laravel.com/) (2026-10); [vapor.laravel.com](https://vapor.laravel.com/) (2026-10) |
| **react-admin** (Marmelab) | MIT core | Full framework free | **react-admin Enterprise Edition** — additional modules + professional services, sold as a subscription | Team plan (2 devs) €170–€1,750; Business plan (10 devs) €340–€3,500 (lemonsqueezy variable pricing); "Starts from €145/month" per marketing page | [react-admin.lemonsqueezy.com](https://react-admin.lemonsqueezy.com/); [marmelab.com/react-admin](https://marmelab.com/react-admin) |
| **AG Grid** | Community (MIT) | Full basic grid free | **Enterprise** — perpetual, **per-developer** license unlocking grouping/pivoting/Excel export/row grouping etc. | AG Grid Enterprise $999/developer/yr; AG Charts Enterprise $499/developer; Bundle $1,498/developer | [ag-grid.com/license-pricing](https://www.ag-grid.com/license-pricing/) (2026-10) |
| **Refine.dev** | MIT core | Open-source React admin framework free | Pivoted toward an AI/vibe-coding product (not a classic open-core CMS/admin-tool model anymore as of 2026); raised a **$2.8M seed** round | — | [refine.dev/blog/refine-investment-announcement](https://refine.dev/blog/refine-investment-announcement) |

### 1.2 Funding / revenue outcomes

| Company | Funding / revenue | As-of | Source |
|---|---|---|---|
| **Payload CMS** | YC S22 ($500K via standard YC deal) → **$4.7M seed** (Nov 2022, led by Gradient Ventures; MongoDB Ventures, SV Angel, Grand Ventures, Exceptional Capital, YC); Tracxn totals $5.2M raised. **Acquired by Figma**, announced June 17, 2025 (terms undisclosed) | 2022 seed; 2025 acquisition | [techcrunch.com/2022/11/15](https://techcrunch.com/2022/11/15/payload-raises-4-7m-for-its-developer-first-headless-cms/); [figma.com/blog/payload-joins-figma](https://www.figma.com/blog/payload-joins-figma) (2025-06-17) |
| **Strapi** | $31M Series B (June 2022, led by CRV; Index Ventures, others) — $46M total raised per Caplight | 2022-06-22 | [strapi.io/blog/series-b](https://strapi.io/blog/series-b); [caplight.com/company/strapi](https://www.caplight.com/company/strapi) (totals, unverified primary) |
| **Strapi revenue** | **$10M revenue, $30M valuation (2024)** — third-party aggregator, no primary confirmation found | 2024 | [getlatka.com/companies/strapi](http://getlatka.com/companies/strapi) (unverified primary) |
| **Directus** | $7M Series A (Nov 10, 2022, True Ventures) | 2022-11-10 | [cbinsights.com/company/directus-1/financials](https://www.cbinsights.com/company/directus-1/financials) (unverified primary) |
| **Ghost(Pro)** | **Live public dashboard: ARR $11,132,578**; Monthly run rate $927,714; net churn 2.68%; 30,547 active customers; 100M+ installs; 55,493 GitHub stars | accessed 2026-10-12 | [ghost.org/about](https://ghost.org/about) |
| **Plausible Analytics** | **$1M ARR** (self-reported blog, bootstrapped, no VC) | 2022-06-22 | [plausible.io/blog/open-source-saas](https://plausible.io/blog/open-source-saas) |
| **Sidekiq** | **$13.5M cumulative gross sales over 10 years**, 1,850 paying customers, **1 employee (solo founder Mike Perham)** — self-reported in his own "10th Birthday" blog post; a later HN comment (2023) claims "closer to $10M than $1M in annual revenue" | 2022-01-17 (cumulative figure); HN comment 2023 | [mikeperham.com/2022/01/17/happy-10th-birthday-sidekiq](https://www.mikeperham.com/2022/01/17/happy-10th-birthday-sidekiq/) via [kaeda.co/cases/sidekiq](https://kaeda.co/cases/sidekiq); [news.ycombinator.com/item?id=35566768](https://news.ycombinator.com/item?id=35566768) |
| **Supabase** | **$500M Series F at $10B pre-money / ~$10.5B valuation** (June 4, 2026, led by GIC; existing investors incl. Stripe); doubled valuation from ~$5B in 8 months | 2026-06-04 | [supabase.com/blog/series-f](https://supabase.com/blog/series-f); [techcrunch.com/2026/06/05/supabase-doubles-valuation-to-10b-in-8-months](https://techcrunch.com/2026/06/05/supabase-doubles-valuation-to-10b-in-8-months/) |
| **GitLab** | Public company (NASDAQ: GTLB); pricing model documented above | — | [about.gitlab.com/pricing](https://about.gitlab.com/pricing/) |

**Implication for VexCMS:** The comparable set shows two clean monetization archetypes that both work without a CMS vendor owning its own server infrastructure: (a) **feature-gated paid license tiers sold independently of hosting** (Strapi CMS pricing vs. Strapi Cloud; Directus Team/Enterprise; Cal.com commercial license; Sidekiq Pro/Enterprise; GitLab Premium/Ultimate), and (b) **pure hosting/usage revenue** (Ghost(Pro), Supabase, PostHog). VexCMS's planned model (Apache-2.0 core forever + flat annual per-company enterprise add-on license, no VexCMS-run server since Convex is the backend) maps most directly onto archetype (a) — closest single analogue is **Sidekiq** (flat recurring license fee layered on a free core, zero infrastructure owned by the vendor) and **Directus Team/Enterprise** (SSO/SCIM/offline strictly paywalled, self-host always free below revenue/headcount thresholds).

---

## 2. Enterprise feature willingness-to-pay evidence (the "SSO tax")

### 2.1 What sso.tax documents generally

The community-maintained [sso.tax "Wall of Shame"](https://sso.tax/) (accessed 2026-10-12) tracks >100 vendors' base price vs. SSO-gated price. Selected relevant entries:

| Vendor | Base price | SSO-gated price | Increase | Updated |
|---|---|---|---|---|
| Sanity | $15/user/mo | $70.96/user/mo | +373% | 2024-01-23 |
| DatoCMS | $100/mo | $667/mo | +567% | 2023-10-17 |
| Prismic | $180/repository/mo | "Call us" | n/a | 2024-07-26 |
| Metabase | $85/mo | $500/mo | +488% | 2024-07-22 |
| GitHub | $4/user/mo | $21/user/mo | +425% | 2020-04-14 |
| Linear | $10/user/mo | $15/user/mo | +50% | 2022-06-09 (smallest gap in the set) |
| Notion | $8/user/mo | $15/user/mo | +88% | 2023-10-15 |

Source: [sso.tax](https://sso.tax/) (accessed 2026-10-12). A companion "State of the SSO Tax 2026" annual report exists at [ssopricing.com/reports/state-of-the-sso-tax-2026](https://ssopricing.com/reports/state-of-the-sso-tax-2026) (not independently re-verified beyond the title/date).

### 2.2 CMS-specific enterprise-feature gating (direct primary-source table)

| Vendor | SSO sits in | That tier's price | Audit log | Review/approval workflows | Localization | Environments/branching |
|---|---|---|---|---|---|---|
| **Payload** | Enterprise (sales-quoted) | Custom/"Schedule a Demo" | Included in open-source core (versions) | Enterprise ("Publishing Workflows") | Included in open-source core | Not a named Payload feature |
| **Strapi** | Enterprise tier, OR Growth as a paid **add-on** ($150/mo + $50/seat) | Enterprise "custom"; Growth SSO add-on $150/mo base | Enterprise only | Enterprise only ("Review Workflows") | Free on all tiers (unlimited locales) | Not a Strapi CMS-license feature (see Strapi Cloud "environments" below) |
| **Directus** | **Team** ($499/mo annual) or Enterprise; **not available on Core at any price** | $499/mo ($5,988/yr) minimum | Not explicitly broken out; "Telemetry Opt-out" and advanced features are Enterprise | n/a (Flows workflow automation on Team: 20 flows) | Not specifically gated | n/a |
| **Sanity** | Enterprise only | Custom/"Contact sales" | Enterprise only ("Full audit trail & History API") | Enterprise ("Content releases," rollback) is add-on from Growth+ | Free on all tiers (unlimited locales/content types) | "Content releases" add-on Enterprise |
| **Storyblok** | Premium/Elite only (custom pricing) | Custom; cheapest self-serve tier (Growth Plus) is $349/mo and does **not** include SSO | Content versioning retention scales by tier (1 day Starter → unlimited Elite) | Not in self-serve tiers; "Custom Workflows" Premium (2) / Elite (unlimited) | Locale count scales by tier (2 → 10 → custom) | "Environments" Premium/Elite only |
| **Contentful** | Enterprise only | Enterprise is custom-quoted; median deal ~$24,050–$54,173/yr per third-party pricing-intel firm (unverified primary) | SCIM provisioning + audit logs Enterprise only | n/a | n/a | n/a |
| **Supabase** | Team ($599/mo) or Enterprise; **not available on Pro ($25/mo) at any price** | $599/mo minimum | Platform Audit Logs Team+ only | n/a | n/a | n/a |
| **Cal.com** | Organizations ($28/user/mo) | $28/user/mo | n/a | n/a | n/a | n/a |
| **GitLab** | Premium ($29/user/mo) | $29/user/mo | Premium+ | Approval rules Premium+ | n/a | Environments (CI/CD) free tier; advanced deployment Premium+ |

Sources: [directus.com/pricing](https://directus.com/pricing) (2026-10); [strapi.io/pricing-cms](https://strapi.io/pricing-cms) (2026-10); [sanity.io/pricing.md](https://www.sanity.io/pricing.md) (2026-10); [new-www.storyblok.com/pricing](https://new-www.storyblok.com/pricing) (2026-10); [supabase.com/pricing.md](https://supabase.com/pricing.md) (2026-10); [cal.com/pricing](https://cal.com/pricing) (2026-10); [about.gitlab.com/pricing](https://about.gitlab.com/pricing/) (2026-10). Contentful pricing page returned HTTP 429 on direct fetch; figures sourced from third-party pricing-intelligence site [vendr.com/marketplace/contentful](https://www.vendr.com/marketplace/contentful) (unverified primary, flagged below) and [contentful.com/enterprise](https://www.contentful.com/enterprise) feature list (confirmed: SSO/SCIM/audit logs bundled into Enterprise DXP tier).

**Implication for VexCMS:** The near-universal pattern across every CMS/devtool comparable is **SSO + audit log + review workflows bundled into the single most expensive gated tier**, usually sales-quoted, usually the first tier above a mid-market self-serve plan (Strapi Growth→Enterprise, Directus Core→Team, Sanity Growth→Enterprise, Supabase Pro→Team). Directus is the cleanest anchor for VexCMS's planned "flat annual per-company license": it prices a Team tier at **$499/mo ($5,988/yr) flat**, not per-seat, specifically to unlock SSO — directly analogous to VexCMS bundling SSO/SAML/OIDC, audit log, and approval workflows into one flat enterprise SKU.

---

## 3. Hosted-cloud option analysis

### 3.1 Do OSS CMS companies earn more from hosting vs. licences?

| Company | Hosting revenue share | License/feature-tier revenue share | Evidence |
|---|---|---|---|
| **Ghost(Pro)** | **100%** — Ghost has no feature-gated tier at all; the entire $11.1M ARR (live, accessed 2026-10-12) comes from managed hosting of an otherwise-identical MIT codebase | 0% | [ghost.org/about](https://ghost.org/about) |
| **Strapi** | Dual-tracked: **Strapi Cloud** (hosting, usage-based $35–$450+/project/mo) is sold as a wholly separate product from **Strapi CMS license tiers** (Growth/Enterprise, feature-gated, self-hostable). Strapi explicitly markets Cloud as "now purely about hosting" (no bundled CMS feature constraints) as of a March 2025 pricing overhaul | Both tracked separately; no public split disclosed | [strapi.io/blog/lower-prices-and-greater-flexibility-with-improved-strapi-cloud-pricing](https://strapi.io/blog/lower-prices-and-greater-flexibility-with-improved-strapi-cloud-pricing) (2025-03-05, updated 2026-05-22) |
| **Directus** | Cloud hosting is a **$99/mo add-on** on top of the Core/Team software tier (i.e., software license and hosting are priced and sold separately, not a single bundled "Cloud" SKU) | Software tiers (Team $499/mo, Enterprise custom) are the larger, clearly-gated revenue driver; Cloud is explicitly "hosting only" | [directus.com/pricing](https://directus.com/pricing) (2026-10) |
| **Payload Cloud** | Was the company's stated monetization vehicle at seed stage ("the plan is to expand the team and invest in the open source community... launch a managed service, Payload Cloud, to power its monetization strategy") — but Payload Cloud **paused new deployments** after the June 2025 Figma acquisition; existing customers continue, pricing unchanged for now | Enterprise self-hosted licensing (SSO, AI, workflows) now appears to be the surviving/emphasized monetization path on payloadcms.com | [techcrunch.com/2022/11/15](https://techcrunch.com/2022/11/15/payload-raises-4-7m-for-its-developer-first-headless-cms/); [payloadcms.com/payload-has-joined-figma](https://payloadcms.com/payload-has-joined-figma) (FAQ: "deployment of new projects is currently paused") |

**Pattern:** No comparable discloses a hosting-vs-license revenue split publicly except Ghost, which is 100% hosting because it has zero feature-gating. Every other comparable treats hosting (Cloud) and licensing (feature tiers) as **separate, parallel revenue lines**, not substitutes — Strapi and Directus both sell a paid CMS license *and* separately monetize hosting of that same software. This directly supports a **dual-track VexCMS model**: an annual enterprise license (SSO/branching/audit/localization) sold independently of any hosting decision, since self-hosted customers on Convex still need the license to unlock enterprise features.

### 3.2 Does Convex permit a "VexCMS Cloud" / managed-offering?

Convex's backend (`get-convex/convex-backend`) is licensed under the **Functional Source License 1.1, Apache-2.0 Future License (FSL-1.1-Apache-2.0)**, copyright Convex, Inc. 2026. Key terms, read directly from the license file:

> "A Permitted Purpose is any purpose other than a Competing Use. A Competing Use means making the Software available to others in a commercial product or service that: (1) substitutes for the Software; (2) substitutes for any other product or service we offer using the Software that exists as of the date we make the Software available; or (3) offers the same or substantially similar functionality as the Software."
> — [github.com/get-convex/convex-backend/blob/main/LICENSE.md](https://github.com/get-convex/convex-backend/blob/main/LICENSE.md) (accessed 2026-10-12)

The FSL converts each version to **Apache 2.0 automatically after 2 years** from release.

**What this means for a "VexCMS Cloud" offering:**
- VexCMS is a layer *on top of* Convex (schema generator + admin panel + typed queries), not a redistribution of the Convex backend itself — so VexCMS itself is not directly constrained by Convex's FSL "Competing Use" clause, as it is not substituting for Convex or offering "substantially similar functionality" to Convex's own BaaS.
- A literal **"VexCMS Cloud" that re-hosts the Convex backend as a resold managed service** (i.e., VexCMS selling its own hosted Convex instances to customers, bypassing Convex's own cloud product) would plausibly trip the Competing Use clause, since that **would** "substitute for" Convex's own cloud offering — this is explicitly the scenario third-party commentary on the FSL flags as prohibited.
- Convex instead offers its own partner/referral path: **[Convex for Startups](https://www.convex.dev/startups)** offers eligible teams **up to 1 year free of Convex Professional**, including no seat fees and **30% off usage-based fees up to $30K** (page accessed 2026-10-12; exact qualifying criteria not published on the page as rendered — eligibility details require application).
- Commentary confirming the FSL non-compete reading: [bex.co blog, "Convex's FSL License Bans Building a Competitor"](https://bex.co/blog/2026/07/12/convex-fsl-source-available-non-compete) (2026-07-12) and background on FSL generally: [fsl.software](https://fsl.software/).

**Implication for VexCMS:** A standalone "VexCMS Cloud" that *resells Convex hosting* is legally risky under Convex's own license terms and strategically redundant — Convex already runs its own managed cloud. The viable "cloud option" for VexCMS is **not** infrastructure reselling but (a) a **hosted admin-panel-as-a-service** (VexCMS runs only the Next.js admin UI, pointed at the customer's own Convex deployment — this does not substitute for Convex's product), and (b) formalizing the **Convex partnership** (referral/ecosystem-listing/sponsorship) explicitly contemplated in the stated monetization plan, leveraging the Convex for Startups program for runway rather than building parallel infrastructure.

---

## 4. Fundraising benchmarks for devtools/OSS (2025–2026)

### 4.1 Pre-seed and seed round benchmarks (Carta data, via secondary aggregation — Carta's own report pages did not expose numeric tables to the fetcher, so figures below are drawn from an aggregator that cites specific Carta reports by quarter)

| Metric | Value | Period | Source |
|---|---|---|---|
| Median seed round size | **~$4M** | 2025 | Carta, cited in [valueaddvc.com/state-of-seed-funding](https://valueaddvc.com/state-of-seed-funding) (2026-06-28) |
| Median seed pre-money valuation | **$16M** (+14% YoY) | Q3 2025 | same |
| Median seed post-money valuation | **$24M** (all-time high) | Q4 2025 | same |
| 95th-percentile seed round | **~$16.6M** (>4x median) | 2025 | same |
| % of early rounds using SAFEs/convertible notes | **90%+** | 2025 | same |
| Typical SAFE valuation cap | **$10M (for $250K–$1M raises) to $15M (for $1M–$2.5M raises)** | 2025 | same |
| Median time seed → Series A | **~2.1 years** (up from 1.5 yrs in 2019) | 2025 | same |
| Seed cohort reaching Series A within 24mo | **~15%** (2023 cohort, down from 30.6% for 2018 cohort) | 2025 | same |
| Pre-seed median pre-money (SAFE cap) | **$10–15M** | 2025–2026 | [startupa.ge/blog/startup-valuation-funding-rounds](https://startupa.ge/blog/startup-valuation-funding-rounds) (citing Carta 2025, unverified primary) |
| AI share of total seed capital | **42%** (vs. 23% pre-ChatGPT) | 2025 | [valueaddvc.com/state-of-seed-funding](https://valueaddvc.com/state-of-seed-funding) |
| Q1 2026 total VC funding (all stages) | **$30.4B**, >60% to AI companies | Q1 2026 | [carta.com — State of Private Markets: Q1 2026](https://carta.com/sg/en/data/state-of-private-markets-q1-2026/) (published 2026-05-29, primary) |
| Down-round rate | **11.4%** (lowest since 2019–2020) | Q1 2026 | same (primary) |

**Caveat:** Carta's own report pages (`carta.com/data/state-of-pre-seed-*`, `state-of-private-markets-*`) render narrative text without exposing the underlying numeric tables to automated fetch; the Q1 2026 report confirmed above *is* a primary Carta source with hard numbers ($30.4B, 11.4% down-round rate, AI = 60%+ of capital). Seed-specific medians ($4M round / $16M pre-money / $24M post-money) come from a third-party blog that cites specific dated Carta reports by name but could not be cross-verified against the original Carta pages directly — flagged in §7.

### 4.2 OSS devtool seed-stage investor expectations

- **Runa Capital's ROSS Index** (Runa Open Source Startup Index) has published quarterly top-20 trending open-source startups **by GitHub star growth rate** since Q2 2020 — this is the most-cited investor-facing signal for "which OSS projects are worth seed investment," and Runa Capital itself actively invests in open-source infrastructure startups (cites Nginx, MariaDB as portfolio pattern). Methodology collects all repos with 1,000+ GitHub stars and ranks by *relative* growth rate (not absolute stars), explicitly to surface early-stage momentum rather than already-large projects. [runacap.com/ross-index](https://runacap.com/ross-index) and [runacap.com/ross-index/methodology](https://runacap.com/ross-index/methodology) (accessed 2026-10-12); raw data: [github.com/RunaCapital/ROSS-Index](https://github.com/RunaCapital/ROSS-Index).

**Implication for VexCMS:** VexCMS at `0.1.0-alpha.23`, solo-founder, ~8 months in, is pre-seed-stage by every Carta metric above (well below the $4M median seed round — more comparable to the ~$500K YC-style pre-seed check or a sub-$1M angel round). The relevant benchmark to hit before raising a priced seed is **GitHub star growth rate** (the ROSS Index signal), not absolute revenue — consistent with how Payload (YC S22) and Strapi (initial funding) raised pre-revenue on open-source traction plus founder credibility.

### 4.3 Notable recent CMS/devtool comparable rounds

| Company | Round | Amount | Date | Source |
|---|---|---|---|---|
| **Payload CMS** | Seed | $4.7M (led by Gradient Ventures) | 2022-11-15 | [techcrunch.com/2022/11/15](https://techcrunch.com/2022/11/15/payload-raises-4-7m-for-its-developer-first-headless-cms/) |
| **Payload CMS** | YC standard deal (S22 batch) | $500K (per then-current YC standard deal) | Summer 2022 | [ycombinator.com/companies/payload](https://www.ycombinator.com/companies/payload) |
| **Payload CMS** | Acquisition by Figma | Undisclosed | 2025-06-17 | [figma.com/blog/payload-joins-figma](https://www.figma.com/blog/payload-joins-figma) |
| **Strapi** | Series B | $31M (led by CRV) | 2022-06-22 | [strapi.io/blog/series-b](https://strapi.io/blog/series-b) |
| **Directus** | Series A | $7M (True Ventures) | 2022-11-10 | [cbinsights.com/company/directus-1/financials](https://www.cbinsights.com/company/directus-1/financials) (unverified primary) |
| **BaseHub** (AI-native headless CMS, content branching — closest direct comp to VexCMS's branching feature) | Acquired by Vercel | Undisclosed; *not* a funding round — a full acquisition, founder (Julian Benegas) joined Vercel's v0 team | 2026-06-02 | [basehub.com/blog/basehub-is-joining-vercel](https://basehub.com/blog/basehub-is-joining-vercel) (primary, 2026-06-02) — note: blog discloses "An investment fund associated with Vercel CEO Guillermo Rauch held a passive investment in BaseHub," implying BaseHub *had* taken some outside investment pre-acquisition, though the round itself is not disclosed in this source |
| **Refine.dev** (open-source React admin framework — closest comp to VexCMS's admin-panel layer) | Seed | $2.8M | announced ~2024 (exact date not in source) | [refine.dev/blog/refine-investment-announcement](https://refine.dev/blog/refine-investment-announcement) |
| **Supabase** | Series F | $500M at $10B pre-money ($10.5B total) | 2026-06-04 | [supabase.com/blog/series-f](https://supabase.com/blog/series-f) |

**Tina CMS / Keystatic:** Searches did not surface a confirmed, dated primary-source funding announcement for either. Tina.io (TinaCMS) appears across aggregators (Crunchbase, Dealroom, PitchBook) as a funded company but no primary press release or blog post with a dollar figure was found. Keystatic is maintained by **Thinkmill**, a design/development consultancy (not itself VC-funded) rather than a standalone funded startup — flagged in §7 as unverified.

---

## 5. Accelerator / grant options

| Program | Terms | Eligibility | Source |
|---|---|---|---|
| **Y Combinator** | Standard deal: **$500,000 total** — $125K for 7% equity on a post-money SAFE, plus an additional $375K on an uncapped SAFE with MFN (most-favored-nation) terms | Open application, no OSS-specific requirement | [ycombinator.com/deal](http://ycombinator.com/deal) (accessed 2026-10-12) |
| **Convex for Startups** | **Up to 1 year free of Convex Professional** (no seat fees) + **30% off usage-based fees up to $30K** | Eligible "teams" building on Convex; exact qualifying criteria (funding stage, incorporation) not exposed in the page's static HTML — requires checking the live application form | [convex.dev/startups](https://www.convex.dev/startups) (accessed 2026-10-12) |
| **Vercel OSS Program** | **$3,600 in Vercel platform credits** distributed over a 12-month cohort, plus partner perks and community support; cohorts run ~4x/year, applications open/close on a rolling cohort schedule | Open-source projects (not restricted to companies); "Applications are currently closed" as of the fetch | [vercel.com/open-source-program](https://vercel.com/open-source-program) (accessed 2026-10-12); credit amount via [ossperks.com/programs/vercel](https://www.ossperks.com/programs/vercel) |
| **GitHub Accelerator** | **$40,000 per project in non-dilutive funding** (most recent published cohort: 2024, themed "Advancing AI"); plus 10-week curriculum, GitHub Copilot access, Azure AI credits, intro to M12 (Microsoft's venture fund) | Current maintainer/contributor of an OSS GitHub project, 18+, team of ≤3, clear OSS license, demonstrated traction, commit to 40hrs/week during program | [accelerator.github.com](https://accelerator.github.com/) (2024 cohort page, accessed 2026-10-12) |
| **GitHub Secure Open Source Fund** | **$10,000 per project**, paid in tranches ($6K during program, $2K at 6-month check-in, $2K at 12-month check-in); plus $10K in Azure credits (up to $150K potential), security tooling/education, 3-week program | Current OSS maintainer (team of ≤2), 18+, demonstrated community traction, security-improvement focus | [github.com/open-source/github-secure-open-source-fund](https://github.com/open-source/github-secure-open-source-fund) (accessed 2026-10-12) |
| **Open Source Pledge** | Not a grant to projects — a **corporate pledge**: member companies commit to pay **$2,000 USD per year per full-time-equivalent developer on staff** directly to OSS maintainers/foundations of their choice. Relevant to VexCMS as a potential *recipient* once it has corporate users, and as a future pledge-taker once it has engineering headcount | Any company; self-directed payments, publicly reported | [opensourcepledge.com/join](https://opensourcepledge.com/join) and [opensourcepledge.com/about](https://opensourcepledge.com/about) ($7.27M raised cumulative, $3M+ in past year, accessed 2026-10-12) |
| **Sovereign Tech Fund** (Germany/EU, via Sovereign Tech Agency) | **€50,000 minimum per project, up to ~€1M in practice** (no fixed upper limit); example: KDE received **€1.28M** | Open-source digital-infrastructure projects deemed strategically relevant to Germany/EU; typically foundational/infra software rather than application-layer products | [tech.eu/2025/07/25](https://tech.eu/2025/07/25/chronic-underfunding-of-open-source-software-poses-strategic-risk-to-europes-digital-sovereignty) (2025-07-25, citing €50K minimum figure); KDE grant: [omgubuntu.co.uk/2026/05/kde-sovereign-tech-fund-grant](https://www.omgubuntu.co.uk/2026/05/kde-sovereign-tech-fund-grant) (2026-05, €1.28M) |
| **NLnet** (NGI Zero funds) | **First grant: €5,000–€50,000** (typical range €5K–€30K); scale-up second grant **up to €150,000**; paid in tranches (30% signing / 40% midpoint / 30% final); bi-monthly open calls, next deadline cited as **Nov 3, 2026** | Open internet/hardware/privacy-aligned OSS projects; individuals, researchers, or companies eligible | [nlnet.nl/funding.html](https://nlnet.nl/funding.html) and [nlnet.nl/propose](https://nlnet.nl/propose/) (accessed 2026-10-12); third-party summary corroborating tranches: [grantchain.eu/blog/nlnet-foundation-grants-guide](https://www.grantchain.eu/blog/nlnet-foundation-grants-guide) (unverified primary for tranche %s) |

**Implication for VexCMS:** Given solo-founder, pre-revenue, pre-seed status, the **lowest-friction near-term options** are: GitHub Secure Open Source Fund ($10K, if VexCMS frames a security angle on field-level RBAC) or GitHub Accelerator ($40K non-dilutive, though themed toward AI in the most recent cohort), Convex for Startups (free Convex Professional + 30% usage discount — directly reduces VexCMS's own Convex costs for dogfooding/demos), and NLnet (€5–50K, though VexCMS's commercial/app-layer focus is a weaker fit for NLnet's "open internet infrastructure" mandate than for Sovereign Tech Fund or NLnet). YC remains the highest-signal but highest-dilution path ($500K for ~7%+ equity), matching exactly how Payload financed its first 18 months.

---

## 6. Standard pitch deck structure (for VexCMS deck design)

### 6.1 Sequoia Capital template (current, 10 sections)

Per Sequoia's own "Writing a Business Plan" framework, the **current** (not the widely-recirculated 2015 version) template is:

1. **Company purpose** — one sentence, no jargon
2. **Problem** — whose pain, what they do today instead
3. **Solution** — why this approach removes the pain
4. **Why now** — what changed in the last ~24 months
5. **Market potential** — built bottom-up (not a top-down TAM circle)
6. **Competition and alternatives** — named rivals *and* the status-quo workaround (renamed/broadened from the older "Competition" slide)
7. **Business model** — who pays, how much, how often
8. **Team** — why this team for this problem
9. **Financials** — traction to date + the ask
10. **Vision** — what the world looks like in 10 years if this works (added; the older template's standalone "Product" slide was dropped — product now lives inside Solution)

Source: [roundfunded.com/en/blogs/sequoia-pitch-deck-template-2026](https://www.roundfunded.com/en/blogs/sequoia-pitch-deck-template-2026) (2026-09-03), which explicitly documents the drift between the commonly-recirculated 2015-era PDF and Sequoia's current guidance. Note: this is a secondary source summarizing Sequoia's publicly stated framework (original Sequoia page at sequoiacap.com/grove/posts was not independently re-verified in this session) — flagged in §7.

### 6.2 YC seed-deck guidance (Kevin Hale / YC Startup Library)

YC's standard advice (Kevin Hale, YC partner, "How to Pitch Your Startup" and "How to design a better pitch deck"):
- Keep the deck **short and legible** — prioritize clarity over completeness; a reader should understand the company from the deck alone in minutes.
- Lead with an unambiguous, jargon-free description of what the company does (the "X for Y" framing is explicitly discussed as a technique, with caveats about overuse).
- Concision is treated as a signal of founder clarity of thought, not just a stylistic preference.

Sources: [ycombinator.com/library/6q-how-to-pitch-your-startup](https://www.ycombinator.com/library/6q-how-to-pitch-your-startup) and [ycombinator.com/library/4T-how-to-design-a-better-pitch-deck](https://www.ycombinator.com/library/4T-how-to-design-a-better-pitch-deck) (listed in YC Startup Library, accessed 2026-10-12; full page content did not render for automated fetch — titles/author/chapter structure confirmed via search index, full prose not independently re-extracted this session, flagged in §7). A companion page, [ycombinator.com/library/2u-how-to-build-your-seed-round-pitch-deck](https://www.ycombinator.com/library/2u-how-to-build-your-seed-round-pitch-deck), provides a specific slide-by-slide seed-deck template but its content also did not render in this session's fetch (JS-rendered page) — flagged in §7.

### 6.3 DocSend / Dropbox pitch-deck research (investor attention data)

DocSend's longitudinal pitch-deck analytics (in partnership with Harvard Business School's Prof. Tom Eisenmann, tracking investor views across thousands of decks) found, in the most recent (2021/2022) pre-seed-focused study:

- **Competitive landscape section**: time investors spend reviewing it rose **51%** year-over-year — now one of the sections investors linger on most (~1 minute).
- **Product readiness section**: time spent rose **46%** — investors increasingly expect to see a working/alpha-or-later product, not just mockups; >50% of the dataset's companies had already-launched or alpha/beta products.
- **Business model section**: time spent rose **28%** — investors want a clearly articulated, evolvable monetization plan, not just a promising idea.

Source: [docsend.com/blog/how-your-pitch-deck-can-shine-as-vc-focus-shifts](https://www.docsend.com/blog/how-your-pitch-deck-can-shine-as-vc-focus-shifts/) (published 2022-01-24, by Justin Izzo, DocSend Research Lead). DocSend's broader multi-year pitch-deck metrics tracker is at [docsend.com/pitch-deck-metrics](https://www.docsend.com/pitch-deck-metrics/).

**Implication for VexCMS:** Given the DocSend findings, VexCMS's deck should weight **three sections above the Sequoia-template default**: (1) competitive landscape — explicitly differentiate from Payload/Strapi/Directus/Sanity/BaseHub by name, not just "no direct competitors"; (2) product readiness — lean on the fact that `0.1.0-alpha.23` is already shipping on npm with a working admin panel, not a prototype; (3) business model — the open-core-plus-enterprise-license model needs the explicit "who pays / how much / how often" answer up front, informed directly by the Sidekiq/Directus comparables in §1–2 above.

---

## 7. Unverified / conflicting

| Item | What was tried | Status |
|---|---|---|
| **Strapi $10M revenue / $30M valuation (2024)** | Only found via [getlatka.com](http://getlatka.com/companies/strapi), a third-party SaaS-revenue aggregator; no primary Strapi disclosure located | Unverified — flagged inline above |
| **Directus "current" ARR/revenue** | Only found $7M Series A total funding (CBInsights, itself an aggregator); no first-party Directus revenue disclosure found | Unverified |
| **Sanity Enterprise "average $193,620/yr"** | Third-party pricing-intel site (spendhound.com); Sanity's own pricing page lists Enterprise as "custom," no public average | Unverified |
| **Contentful pricing page** | Direct fetch of contentful.com/pricing returned HTTP 429 (rate-limited); fell back to Vendr (third-party pricing intelligence) for the $24,050–$54,173/yr median deal figure, and to contentful.com/enterprise (which did load) for the feature-bundling claim (SSO/SCIM/audit logs in Enterprise DXP tier) | Partially verified — feature-gating confirmed primary, dollar figures not |
| **Tina CMS / Keystatic funding** | Multiple searches (Crunchbase, Dealroom, PitchBook aggregator listings) show "funded" status but no dated primary press release or blog post with a dollar figure for either company was found | Unverified — could not confirm any specific round size or date |
| **BaseHub pre-acquisition funding round** | BaseHub's own June 2026 blog post discloses a Vercel-CEO-affiliated fund "held a passive investment" pre-acquisition, implying a prior round existed, but no round size/date is disclosed anywhere found; Tracxn's "$87.2M secured Apr 2025" figure appears to conflate BaseHub with unrelated/noisy aggregator data and was not used | Unverified — only the June 2026 Vercel acquisition itself (undisclosed terms) is confirmed |
| **Carta seed-stage medians ($4M round / $16M pre-money / $24M post-money)** | Found only via a third-party blog ([valueaddvc.com](https://valueaddvc.com/state-of-seed-funding)) that cites specific dated Carta report URLs; Carta's own report landing pages (carta.com/data/state-of-pre-seed-*, state-of-private-markets-q3-2025) render narrative summaries without the underlying numeric tables in automated fetch, so the exact figures could not be cross-checked against Carta's primary page content directly. The **Q1 2026** Carta figures ($30.4B raised, 11.4% down-round rate, 60%+ to AI) *were* independently confirmed from Carta's own primary page | Partially verified — Q1 2026 top-line primary; seed-specific medians secondary-sourced only |
| **"State of the SSO Tax 2026" annual report** | Found via search (ssopricing.com) but not independently fetched/read in full | Unverified beyond title/existence |
| **YC seed-deck template detailed slide contents** (ycombinator.com/library/2u and /6q and /4T) | Pages are JS-rendered single-page apps; automated fetch returned only metadata/headers, not body prose. Slide structure summarized here is inferred from search-result snippets and page titles, not full primary-source text | Partially unverified — exists and is correctly titled/authored, but full content not independently re-extracted |
| **Sequoia's original pitch-deck page** | sequoiacap.com/grove/posts/... (the original hosting location referenced by multiple secondary sources) was not independently fetched this session; the 10-section breakdown above comes from a 2026 secondary source (roundfunded.com) that itself claims to quote Sequoia's current guidance verbatim | Unverified against Sequoia's own page directly |

---

## Summary for pitch deck use

1. **VexCMS's planned model (Apache-2.0 core forever + flat annual per-company enterprise license) has real-world precedent that works at small scale with zero infra ownership**: Sidekiq (solo founder, $13.5M cumulative gross sales over 10 years, flat Pro/Enterprise pricing, LGPL→commercial license conversion) is the closest single analogue — no managed hosting required.
2. **Every comparable CMS vendor bundles SSO + audit log + approval workflows into one gated "Enterprise" tier**, and Directus's flat $499/mo ($5,988/yr) Team tier is the most direct pricing anchor for VexCMS's enterprise SKU — not per-seat, which matches "flat annual per-company licence."
3. **Hosting and licensing are separate, parallel revenue lines in every comparable that has both** (Strapi, Directus) — meaning VexCMS doesn't need to choose between the two; but a literal "VexCMS Cloud" reselling Convex is legally constrained by Convex's own FSL "Competing Use" clause, so the cloud angle should be framed as a hosted-admin-panel product or a formalized Convex partnership (Convex for Startups gives up to 1yr free Professional + 30% usage discount), not infrastructure resale.
4. **VexCMS is pre-seed by every Carta benchmark** (median seed is ~$4M/$16M pre-money, far above where a solo-founder/alpha-stage/pre-revenue company sits); the realistic near-term capital path is YC ($500K/~7%) or non-dilutive grants (GitHub Secure Open Source Fund $10K, GitHub Accelerator $40K, NLnet €5–50K), with GitHub star growth rate (Runa Capital's ROSS Index methodology) as the key traction signal investors will look for before a priced round.
5. **Deck structure**: lead with Sequoia's current 10-section skeleton (Company purpose → Problem → Solution → Why now → Market potential → Competition and alternatives → Business model → Team → Financials → Vision), but over-invest in Competition, Product readiness, and Business model specifically — DocSend data shows investor attention on those three sections rose 51%/46%/28% YoY in the most recent pre-seed study.
