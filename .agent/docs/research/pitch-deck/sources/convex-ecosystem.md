# Convex Ecosystem Research — for VexCMS Pitch Deck

All figures carry inline citations + as-of dates. Today: 2026-10-12. Where only aggregator/analyst data exists (no primary source found), this is flagged explicitly.

---

## 1. Company facts

| Fact | Detail | Source | As of |
|---|---|---|---|
| Founded | 2021, San Francisco | [Forbes](https://www.forbes.com/sites/kenrickcai/2022/04/27/convex-series-a-26-million-developers-dump-databases/) | Apr 27 2022 |
| Founders | James Cowling (CTO), Sujay Jayakar, Jamie Turner (CEO) — all ex-Dropbox, where they worked on Dropbox's internal data-storage/sync infrastructure | [Forbes](https://www.forbes.com/sites/kenrickcai/2022/04/27/convex-series-a-26-million-developers-dump-databases/); [About Convex](https://convex.dev/about-us) | Apr 2022 / live |
| Mission statement | "Convex's mission is to fundamentally change how software is built on the Internet and who gets to build it." | [About Convex](https://convex.dev/about-us); repeated in [$24M raise post](https://news.convex.dev/convex-raises-24m/) | Nov 12 2025 |

### Funding history (company operating convex.dev — NOT to be confused with the unrelated commercial-insurance "Convex" or "Convex, Inc." sales-intelligence company that share the name)

| Round | Amount | Date | Lead / notable investors | Valuation | Source |
|---|---|---|---|---|---|
| Seed | $3.5M | Nov 2 2021 | Neo Ventures, Netlify's Jamstack Innovation Fund, General Catalyst, SV Angel, Fathom, #ANGELS, Alumni Ventures, Upscalers | n/d | [Sacra via search](https://sacra.com/c/convex/) *(secondary — primary Convex News post for this round not located)* | Nov 2021 |
| Series A | $26M | Apr 27 2022 | Led by a16z (Martin Casado joined board); angels Nat Friedman, Ram Shriram, Michael Ovitz; Netlify Jamstack fund | $128M post-money | [Forbes](https://www.forbes.com/sites/kenrickcai/2022/04/27/convex-series-a-26-million-developers-dump-databases/) | Apr 27 2022 |
| Unnamed round | $24M | Nov 12 2025 | Led by a16z, co-led by Spark Capital; Neo Ventures, Alumni Ventures, Upscalers; angels Adam D'Angelo, Drew Houston, Theo Browne | not disclosed | [Convex News](https://news.convex.dev/convex-raises-24m/) | Nov 12 2025 |
| Series B | $57M | Aug 4 2026 | Led by Insight Partners; Etna Labs, Spark Capital, a16z, Justin Kan | $128M–~ per Caplight secondary estimate *(unverified, see below)* | [Convex News](https://news.convex.dev/convex-raises-57m/); [PR Newswire](https://www.prnewswire.com/news-releases/convex-raises-57m-series-b-led-by-insight-partners-to-scale-the-reliable-backend-for-the-ai-era-302841686.html) | Aug 4 2026 |

- **Total disclosed funding ≈ $110.5M** across 4 rounds (3.5+26+24+57=110.5) — matches third-party aggregator totals. [Seedtable](https://seedtable.com/companies/convex-2/funding-rounds/series-b-2026-08) *(secondary, cross-checked against primary round amounts above)* — Aug 2026.
- **Headcount:** No official figure published by Convex. Aggregators disagree: PitchBook cites **41 employees**; Tracxn cites **43**; Seedtable cites **31**; LinkedIn company page shows a small team (page followers ≈2,091, not a headcount figure). Treat as **≈30–43 employees, unverified precisely**. [PitchBook](https://pitchbook.com/profiles/company/484728-40) / [Tracxn](https://tracxn.com/d/companies/convex/__o2FAoT8N_g0HSwVgzo3y--lVmyCMMJh_QQCK09tqXac) / [Seedtable](https://seedtable.com/companies/convex-2) — all accessed Oct 2026.
- **Implication for VexCMS:** Convex is still a small, VC-funded team (sub-50 people) rapidly growing revenue — it has almost certainly not built (and won't soon build) a polished CMS/admin product itself; see §3 and §6.

---

## 2. Growth / traction

### Headline growth numbers (primary source: Convex's own blog, written by CEO Jamie Turner)

| Metric | Value | Source | As of |
|---|---|---|---|
| Paying teams | "nearly 10,000 paying teams" | [Convex for Enterprise](https://news.convex.dev/enterprise-launch/) | Apr 2 2026 |
| Customer/project/revenue growth | "grown by more than 10x in the last nine months" (i.e., ~Feb 2025 → Nov 2025) | [$24M raise post](https://news.convex.dev/convex-raises-24m/) | Nov 12 2025 |
| Production scale | "Millions of Convex instances are now running in production" | [$57M Series B post](https://news.convex.dev/convex-raises-57m/) | Aug 4 2026 |
| Enterprise plan customers | Named: Conduit, doxy.me, Orchid, Reducto, Town | [Convex for Enterprise](https://news.convex.dev/enterprise-launch/) | Apr 2 2026 |
| Enterprise waitlist (pre-launch) | "dozens of companies on our Enterprise plan waitlist" | [$24M raise post](https://news.convex.dev/convex-raises-24m/) | Nov 12 2025 |
| EU hosting | "European hosting is live for teams that need EU data residency" | [$57M Series B post](https://news.convex.dev/convex-raises-57m/) | Aug 4 2026 |

### GitHub (fetched live via api.github.com, 2026-10-12)

| Repo | Stars | Forks | Created | Notes |
|---|---|---|---|---|
| [`get-convex/convex-backend`](https://github.com/get-convex/convex-backend) | **12,688** | 827 | 2024-03-08 (open-source launch) | The self-hostable Convex backend (Rust core) |
| [`get-convex/convex-js`](https://github.com/get-convex/convex-js) | 372 | — | 2023-04-27 | JS/TS client + CLI |
| [`get-convex/chef`](https://github.com/get-convex/chef) | 4,597 | 924 | 2025-03-31 | Convex Chef AI app builder (Apache-2.0) |

*(All via `api.github.com/repos/<org>/<repo>`, fetched 2026-10-12.)*

### npm downloads — `convex` package (fetched live via api.npmjs.org, 2026-10-12)

| Window | Downloads | Source |
|---|---|---|
| Last 7 days (2026-10-04 → 2026-10-10) | **1,703,652** | `api.npmjs.org/downloads/point/last-week/convex` |
| Last 30 days (2026-09-11 → 2026-10-10) | **6,865,448** | `api.npmjs.org/downloads/point/last-month/convex` |
| Same calendar week, 1 year earlier (2025-10-04 → 2025-10-10) | **139,429** | `api.npmjs.org/downloads/point/2025-10-04:2025-10-10/convex` |

**Year-over-year growth: 1,703,652 / 139,429 ≈ 12.2× in weekly npm downloads of the `convex` package over the last 12 months** (both windows fetched live from the npm registry API, 2026-10-12). This is a strong, independently-verifiable proxy for developer adoption that doesn't rely on Convex's own PR.

### Implication for VexCMS
Convex's own distribution is compounding fast (12x npm downloads YoY, ~10,000 paying teams, millions of production instances) — a CMS ships into a *growing* addressable market, not a shrinking or flat one. But the company is young enough (≈30-40 people) that a dedicated CMS/content-admin product is not a near-term roadmap item (see §3).

---

## 3. Product direction relevant to a CMS

### Open-sourced backend / self-hosting
- Convex open-sourced the backend in 2024: [Convex goes open-source](https://news.convex.dev/convex-goes-open-source/) (2024). Self-hosting guide: [docs.convex.dev/self-hosting](https://docs.convex.dev/self-hosting) — dashboard, CLI, and clients are also open source.
- License: **FSL-1.1-Apache-2.0** ("Functional Source License, Apache 2.0 Future License") — source-available, free to self-host and modify for any purpose *except* building a competing hosted backend service; automatically converts to plain **Apache-2.0 two years after each release**. [LICENSE.md, get-convex/convex-backend](https://raw.githubusercontent.com/get-convex/convex-backend/main/LICENSE.md); explained in [docs.convex.dev/self-hosting](https://docs.convex.dev/self-hosting.md) — fetched 2026-10-12.
- Analyst commentary flags the FSL non-compete clause as a real constraint for anyone trying to *resell Convex itself* (not relevant to VexCMS, which builds an app on top of Convex rather than competing with Convex's own hosting): [bex.co blog, Jul 12 2026](https://bex.co/blog/2026/07/12/convex-fsl-source-available-non-compete).

### Convex Components (convex.dev/components)
- **175 components** listed in the directory as of 2026-10-12 — a curated, searchable registry of npm packages that plug into any Convex app (auth, agents, RAG, rate limiting, geospatial, etc.). [Convex Components Directory](https://www.convex.dev/components/components.md) — fetched 2026-10-12.
- Components are "sandboxed building blocks... mini backends with their own schema, functions, and data, isolated behind an explicit API" — explicitly positioned by Convex as core to its future platform strategy. [$57M Series B post](https://news.convex.dev/convex-raises-57m/) — Aug 4 2026.
- Convex has stated an intent to turn Components into a **real marketplace with revenue for third-party developers**: *"Soon, we want them to be a real marketplace, where individual developers can bootstrap businesses as Convex components."* [$24M raise post](https://news.convex.dev/convex-raises-24m/) — Nov 12 2025. **No revenue-share percentage or marketplace launch has been published yet** (searched specifically; not found — see "Unverified" section).
- There is already a basic, unofficial CMS-flavored component in the directory — **"Basic Blog"** (`basic-blog-convex-blog-cms`), a headless blog CMS w/ bundled TipTap admin UI, 539 weekly downloads, built by a third party (`daocodotorg`), not by Convex itself. [Component page](https://www.convex.dev/components/basic-blog-convex-blog-cms/llms.txt) — fetched 2026-10-12. This validates organic developer demand for CMS-shaped tooling on Convex, but it is a single-maintainer hobby project with no RBAC, live preview, blocks, or admin-panel sophistication — i.e., no real competitor to VexCMS today.

### Convex Chef (AI app builder)
- Launched Apr 10 2025: "the only AI app builder that knows backend" — full-stack prompt-to-app generator built natively on Convex. [Meet Convex Chef](https://news.convex.dev/meet-chef/) — Apr 10 2025.
- GitHub: [get-convex/chef](https://github.com/get-convex/chef), 4,597 stars, Apache-2.0, created Mar 31 2025 (fetched 2026-10-12).
- **Status: Chef is being sunset/replaced.** "Convex Chef has had a good run but we're in the process of replacing it with something new" — per [Chef Migration Guide](https://docs.convex.dev/chef/migration-guide.md), fetched 2026-10-12. Implication: AI-app-builder is not where Convex's product attention is currently concentrated — reinforces there's no near-term CMS/admin-builder competitor from Convex itself.

### Convex for Startups
- Program offering **up to 1 year free of Convex Professional** (no seat fees, discounted usage fees up to $30k) for eligible startups. [Convex for Startups](https://www.convex.dev/startups) — fetched 2026-10-12; [launch announcement](https://news.convex.dev/announcing-the-convex-for-startups-program/).
- Convex also runs a formal **partner channel for accelerators/incubators/VC firms** to refer startups into the program: [Become a Convex for Startups partner](https://www.convex.dev/startups/partners/apply) — fetched 2026-10-12.
- Per the Apr 2026 Enterprise-launch post, Convex is "upgrading the Convex for Startups plan to include additional benefits, including access to Business Plans with the monthly minimum waived and bundled service credits." [Convex for Enterprise](https://news.convex.dev/enterprise-launch/) — Apr 2 2026.

### Convex Champions (ambassador program)
- "Champions use Convex to build apps and support our community with product feedback, design suggestions, and content." Public roster of community advocates. [Convex Champions](https://www.convex.dev/champions) — fetched 2026-10-12 (page is client-rendered; full roster not extractable via static fetch, but program existence and description confirmed from page metadata).

### Stack (stack.convex.dev)
- Stack is "the Convex developer portal and blog, sharing bright ideas and techniques for building with Convex" — hosts both Convex-team and community/guest technical posts (e.g., posts tagged "Walkthroughs," author pages for both Convex employees like Lee Danilek/Sarah Shader and community contributors). [Stack by Convex](https://stack.convex.dev/); [All articles](http://stack.convex.dev/articles) — fetched 2026-10-12. This is a plausible distribution channel for a "Building a CMS on Convex" guest post.

### Convex's own statements about CMS/admin
- No official Convex blog post, roadmap item, or Discord announcement proposing Convex build its own CMS was found despite targeted searches. The closest signal is indirect: Convex explicitly frames Components as the mechanism by which the community (not Convex itself) should build vertical products like a CMS — see the Components-marketplace quote above.
- **Confirms the gap VexCMS fills**: nothing in Convex's own public roadmap competes with a full admin-panel CMS.

---

## 4. Convex pricing today (2026-10-12, fetched live from convex.dev/pricing's embedded page data)

| Plan | Price | Developers | Function calls | DB storage | File storage | Query/search | Notes |
|---|---|---|---|---|---|---|---|
| **Free** | $0 | 1–6 | 1M included/mo | 0.5 GB included | 1 GB included | 3,000 query-GBs included | Built-in resource caps; email warnings as you approach limits |
| **Starter** | $0/month base, pay-as-you-go beyond free-tier limits | 1–6 | same base as Free, then metered | metered beyond free tier | metered | metered | Scale-to-zero; "Starter plan is pay-as-you-go beyond free tier limits" |
| **Professional ("Pro")** | **$25/developer/month** | 1–20 | 25M included/mo | 100 GB included | 50 GB included | 50,000 query-GBs included | "Popular" plan; higher built-in resources + lower per-unit overage rates than Starter |
| **Business** | **$2,500/month minimum**, month-to-month, no annual commitment | 50+ | — (usage-based) | — | — | — | New Apr 2026: SSO, SIEM audit logs, dedicated/unlimited deployments, priority support |
| **Enterprise** | Custom (same features as Business + custom contracts, precommit annual discounts) | 50+ | — | — | — | — | For large orgs / multi-generation migrations |

**Overage rates (per-unit, Pro plan), as of the Apr 2026 pricing update:**
- Function calls: metered **per million** beyond included
- Query/mutation & action compute: metered **per GB-hour**
- Database storage / file storage / search storage / database I/O: metered **per GB**
- **Data egress** (replaced "file bandwidth" Apr 2026): **$0.12/GB**, ~3× cheaper than the old file-bandwidth rate; all network *ingress* is now free

Sources: [convex.dev/pricing](https://www.convex.dev/pricing) (embedded JSON extracted from page payload, fetched 2026-10-12); [Convex for Enterprise (pricing-update post)](https://news.convex.dev/enterprise-launch/) — Apr 2 2026; [Introducing the new Convex Starter Plan](https://news.convex.dev/introducing-the-new-convex-starter-plan-pay-for-only-what-you-need/) — secondary mention of Starter plan's 2024/2025 launch, title only confirmed via search snippet, not fully read.

**Implication for VexCMS:** A typical VexCMS install for a small team runs on Convex's **Free tier ($0)** through early traction, then **Pro at $25/seat/month** — meaning the all-in cost of adopting VexCMS is "VexCMS license (free/OSS or paid add-on tier) + $0–25/dev/month in Convex infra," a materially lower floor than most competing headless CMSes bundled with their own hosted database tier.

---

## 5. Competitive platform context — "every platform ecosystem gets a CMS"

### Supabase (primary Convex substitute / adjacent platform)

| Round | Amount | Date | Valuation | Source |
|---|---|---|---|---|
| Series D | $200M | Apr 22 2025 | $2B | [Fortune](https://fortune.com/2025/04/22/exclusive-supabase-raises-200-million-series-d-at-2-billion-valuation) |
| Series E | $100M | Oct 3 2025 | $5B | [TechCrunch](https://techcrunch.com/2025/10/03/supabase-nabs-5b-valuation-four-months-after-hitting-2b); [Fortune](https://fortune.com/2025/10/03/exclusive-supabase-raises-100-million-at-5-billion-valuation-as-vibe-coding-soars) |
| Series F | $500M | Jun 4 2026 | $10.5B | [CNBC](https://www.cnbc.com/2026/06/04/database-startup-supabase-raises-500-million-10point5-billion-valuation.html) |

- Developer count: **"more than 4 million developers and over 100,000 customers"** as of the Oct 2025 Series E. [BuiltInSF](https://www.builtinsf.com/articles/supabase-raises-100m-series-e-5b-valuation-20251007) — Oct 7 2025.
- Supabase's own live partner page states **"Reach 9 million developers"** (current figure, up from the ~4M cited at the Oct 2025 raise — consistent with continued fast growth). [supabase.com/partners](https://supabase.com/partners) — fetched 2026-10-12.
- **Supabase Partners program** (live, formal): two tracks — "Integration Partner" (ship a tool/connector, get listed + co-marketed) and "Solution Partner" (agencies/consultancies). Listed integration partners include Directus and Strapi (both full headless CMSes) alongside Stripe, Resend, Clerk, etc. [supabase.com/partners](https://supabase.com/partners); [Directus | Works With Supabase](https://supabase.com/partners/integrations/directus); [Strapi × Supabase integration](https://strapi.io/integrations/supabase) — fetched 2026-10-12. **This is the direct precedent for "a backend platform's ecosystem naturally attracts/formalizes CMS partners."**

### Firebase (older incumbent BaaS, context for "platforms eventually need content tooling too")
- "Millions of developers use Firebase... powering over 70 billion instances of apps every day." [Google Cloud Blog, Firebase Studio launch](https://cloud.google.com/blog/products/application-development/firebase-studio-lets-you-build-full-stack-ai-apps-with-gemini) — 2025.
- "In just over a month, our community has already created over 1.5 million [Firebase Studio AI] workspaces." [firebase.blog, I/O 2025 recap](https://firebase.blog/posts/2025/05/whats-new-at-google-io/) — May 2025.
- Crunchbase cites Firebase as "used by >1,000,000 developers." [Crunchbase](https://www.crunchbase.com/organization/firebase) — accessed 2026-10-12 (secondary aggregator, Google does not appear to publish a current developer count itself).

### Direct CMS-on-platform analogies

| Analogy | Evidence | Implication for VexCMS |
|---|---|---|
| **Payload CMS acquired by Figma** | Figma acquired Payload (open-source, MIT-licensed Next.js headless CMS) in June 2025. "I'm excited to share that Payload is joining Figma." [Figma Blog](https://figma.com/blog/payload-joins-figma) — Jun 17 2025; [Payload's own announcement](https://payloadcms.com/posts/blog/payload-is-joining-figma) — Jun 17 2025; project "stayed MIT-licensed and open source" post-acquisition. [The Frontend Company](https://www.thefrontendcompany.com/posts/payload-cms-guide) — Sep 3 2026. *(Deal value: reporting suggests an early VC conversation around "$10-15M" range per a local Grand Rapids business outlet, but that source could not be fetched directly — HTTP 403 — so treat as unverified; flagged below.)* | Proof that a well-executed open-source, code-first, TypeScript headless CMS is a plausible **strategic acquisition target** for a platform company — the exact playbook VexCMS is pursuing relative to Convex, Vercel, or another platform. |
| **BaseHub joining Vercel** | "I'm excited to share that BaseHub is joining Vercel," June 2 2026 — BaseHub (an AI-native headless CMS, content-branching pioneer, direct VexCMS comparable named in the brief) was acquired by/joined Vercel. Vercel's statement: *"Vercel is not planning to enter the CMS space, and BaseHub will continue to work as it does today."* [BaseHub blog](https://basehub.com/blog/basehub-is-joining-vercel) — Jun 2 2026. | **Very strong, timely analogy**: a frontend/deploy platform (Vercel) just absorbed a content-branching CMS competitor to VexCMS. Signals (a) platforms do want CMS capability in their orbit, (b) they often prefer to **acquire** rather than build in-house (echoing Vercel's explicit "not planning to enter the CMS space" line), (c) the content-branching feature VexCMS plans as a paid add-on is exactly what got BaseHub acquired. |
| **Sanity × Vercel partnership** | "Strategic partnership with Sanity—the Composable Content Cloud," announced by Vercel CEO Guillermo Rauch, May 17 2023; Sanity added as a **native one-click Vercel Marketplace integration** with unified billing, Feb 6 2026. [Vercel Blog, 2023](https://vercel.com/blog/vercel-sanity-innovating-on-a-faster-collaborative-web); [Vercel Marketplace changelog](https://vercel.com/changelog/sanity-vercel-marketplace) — Feb 6 2026; [Sanity's own post](https://www.sanity.io/blog/vercel-marketplace) — Feb 6 2026. | Shows an even lighter-weight precedent: a platform doesn't need to *acquire* a CMS, it can formally list/bill it as a native marketplace partner — a template for a prospective "VexCMS on the Convex ecosystem" listing. |
| **Supabase × Directus / Strapi** | See table above — Supabase's own partner catalog lists two competing headless CMSes as "Integration Partners," each with dedicated co-branded integration docs. [Directus × Supabase](https://directus.com/resources/how-directus-and-supabase-are-partnering-to-support-backend-developers) | Shows that even a platform that is *not* primarily a CMS still formally partners with (plural) CMSes rather than building its own — the most direct precedent for what VexCMS could become to Convex. |

---

## 6. Platform risk

### What if Convex builds its own CMS?
- No evidence found of Convex planning to build a CMS in-house (see §3). Convex's stated strategy is the opposite: push vertical products like a CMS out to the **Components ecosystem** for third parties to build and monetize. [$24M raise post](https://news.convex.dev/convex-raises-24m/) — Nov 12 2025.
- Precedent from the closest analog platform (Vercel/BaseHub) is an explicit public statement of *not* wanting to enter the CMS space even after acquiring a CMS company: "Vercel is not planning to enter the CMS space." [BaseHub blog](https://basehub.com/blog/basehub-is-joining-vercel) — Jun 2 2026.

### What if Convex changes pricing or raises prices?
- Convex's CEO has publicly and repeatedly acknowledged this exact customer fear: *"'What if you jack up prices?' Others worry that one day we'll take unfair advantage of high switching costs and monetize customers unsustainably."* His stated mitigation is explicitly the **open-source, self-hosted edition**: *"We can develop a scale-up version of our open-source, self-hosted edition, so our customers have a more feasible alternative to our cloud service."* [$24M raise post](https://news.convex.dev/convex-raises-24m/) — Nov 12 2025.
- Track record so far: Convex's Apr 2026 pricing update **lowered** egress pricing (~3× cheaper) and **raised** included deployment limits (120→300) for existing self-serve plans rather than raising prices — "we're pretty damn happy with how these plans have held up... don't need any major changes." [Convex for Enterprise](https://news.convex.dev/enterprise-launch/) — Apr 2 2026.

### What if Convex shuts down / gets acquired / winds down the hosted service?
- Same CEO quote above addresses this directly: *"'What if Convex shuts down?' Some worry that a challenging venture capital landscape in the future will mean we need to sell the company or end the cloud service."*
- **Mitigation is structural, not just promissory**: the Convex backend is licensed **FSL-1.1-Apache-2.0** — source-available today, and automatically converts to full, unrestricted **Apache-2.0 two years after each release** regardless of what happens to the company. [LICENSE.md](https://raw.githubusercontent.com/get-convex/convex-backend/main/LICENSE.md); [self-hosting docs](https://docs.convex.dev/self-hosting.md) — fetched 2026-10-12.
- Self-hosting is a documented, supported path today (not just theoretical): [self-hosting guide](https://github.com/get-convex/convex-backend/blob/main/self-hosted/README.md), with a dedicated `#self-hosted` Discord channel — fetched 2026-10-12.
- **Implication for VexCMS**: VexCMS should message this directly — "VexCMS runs on Convex, and Convex's backend is open-source and self-hostable today, with every release becoming fully unencumbered Apache-2.0 after two years. If Convex the company ever disappeared, the software you depend on does not."

---

## Partnership-asks evidence list — which Convex programs VexCMS could plug into

| Program | What it is | Evidence | How VexCMS could use it |
|---|---|---|---|
| **Convex Components directory** | 175-component marketplace/registry (convex.dev/components), with a stated company intent to make it a real revenue marketplace for third-party developers | [Components directory](https://www.convex.dev/components/components.md); [$24M post](https://news.convex.dev/convex-raises-24m/) | List VexCMS core (or specific pieces, e.g. the admin-panel generator) as an official Component; be first-mover before the marketplace/revenue-share formalizes |
| **Convex for Startups** | Up to 1 year free Professional plan + partner-referral channel for accelerators/VCs | [convex.dev/startups](https://www.convex.dev/startups); [partner application](https://www.convex.dev/startups/partners/apply) | Apply as a partner so VexCMS can be bundled as the recommended CMS for startups onboarding to Convex via this program |
| **Stack (stack.convex.dev)** | Convex's developer blog/portal, publishes both staff and community/guest technical posts | [stack.convex.dev](https://stack.convex.dev/); [article archive](http://stack.convex.dev/articles) | Pitch a "Building a type-safe CMS on Convex" guest post for direct distribution to Convex's developer audience |
| **Convex Champions** | Ambassador program for community advocates who get product-feedback access and amplification | [convex.dev/champions](https://www.convex.dev/champions) | Nominate VexCMS's founder/maintainers as Champions for a direct line to the Convex product team and community reach |
| **Sales/partnerships contact** | Convex has an active enterprise sales motion (`sales@convex.dev`) actively building out Business/Enterprise tiers and naming customers publicly | [Convex for Enterprise](https://news.convex.dev/enterprise-launch/) | Approach Convex's BD/partnerships function directly about an ecosystem-listing or co-marketing arrangement, modeled on Supabase's formal Integration Partner program |
| **Precedent model: Supabase Partners** | Formal two-track partner program (Integration/Solution) that already lists two competing headless CMSes (Directus, Strapi) | [supabase.com/partners](https://supabase.com/partners) | Use as the explicit ask/template when pitching Convex: "give VexCMS the Directus/Strapi-on-Supabase treatment" |
| **Precedent model: Vercel Marketplace / Sanity** | One-click, billed-through-platform CMS integration | [Vercel Marketplace changelog](https://vercel.com/changelog/sanity-vercel-marketplace) | Longer-term target once VexCMS has a hosted/managed offering: native marketplace listing with unified billing |

---

## Unverified / conflicting — flagged, not used as fact above

- **Payload/Figma deal value**: A Grand Rapids business-press article reportedly discusses a "$10 million to $15 million" venture-funding-vs-acquisition framing, but the source (`crainsgrandrapids.com`) returned HTTP 403 and could not be read directly; no acquisition price has been confirmed by Figma or Payload's own posts (both omit a dollar figure). **Do not cite a specific Payload acquisition price in the deck.**
- **Convex Series B ($57M) post-money valuation**: Caplight lists an "Est. Valuation: $128M" for Convex's "Last Round — Series B, Aug 4, 2026," but $128M is the *same number* reported for the 2022 Series A post-money valuation — this looks like a stale/incorrect figure on Caplight's part, not a genuine current valuation. CBInsights separately shows inconsistent/conflicting totals ($86.5M vs $5.296B — the latter is almost certainly the unrelated insurance "Convex" company). **No reliable current valuation for Convex (the Convex.dev BaaS) could be verified; do not state a Series-B valuation figure.**
- **Convex headcount**: see §1 — aggregators disagree (31/41/43); no official number published.
- **Convex Components revenue-share terms**: Convex has stated intent ("soon... a real marketplace") but as of 2026-10-12 no published revenue-share percentage, marketplace launch date, or monetization terms for component authors could be found via targeted search.
- **Seed round primary source**: The $3.5M Nov 2021 seed round numbers come from a secondary aggregator (Sacra); no primary `news.convex.dev` post covering the seed round specifically was located (the earliest `news.convex.dev` post found, "Hello serverless world," Nov 2 2021, announces the company's existence but was not read in full for seed-round terms).

---

## 5-line summary of the most pitch-relevant findings

Convex is a fast-growing, well-capitalized (~$110.5M raised, Insight Partners-led $57M Series B in [Aug 2026](https://news.convex.dev/convex-raises-57m/)), still-small (~30-40 person) platform with ~10,000 paying teams and 12.2x YoY npm-download growth — a genuinely growing ecosystem, not a bet on a dying platform. Convex's own public roadmap explicitly pushes vertical products like a CMS out to its 175-component third-party ecosystem rather than building one itself, and it has a live Startups/Champions/Stack partner infrastructure VexCMS can plug straight into. The strongest market-timing signal is that Vercel just acquired BaseHub (VexCMS's closest comparable) in [June 2026](https://basehub.com/blog/basehub-is-joining-vercel) while stating "Vercel is not planning to enter the CMS space" — directly validating both the acquisition thesis (see also [Payload→Figma](https://figma.com/blog/payload-joins-figma)) and the precedent that platforms partner with/acquire CMSes rather than build them (see also [Supabase's Directus/Strapi partner listings](https://supabase.com/partners)). On cost: Convex is free up to real usage and $25/developer/month on Pro, making "VexCMS + Convex" a materially cheaper total stack than most hosted CMS competitors. On platform risk, Convex's CEO has personally and publicly pre-answered the "what if you shut down / raise prices" objection by committing to FSL-1.1-Apache-2.0 self-hostable source (auto-converting to plain Apache-2.0 after two years) as the trust mechanism — which VexCMS inherits and can cite directly as its own downside protection.
