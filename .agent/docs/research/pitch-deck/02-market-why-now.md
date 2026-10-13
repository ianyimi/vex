# 02 — Market size and why now

> Feeds slides: **Why now · Market potential (TAM/SAM/SOM)**.
> Full tables and every citation: `sources/market-size.md`, `sources/convex-ecosystem.md`.
> Spot-checked by hand against primary sources on 2026-10-12: Convex Series B release,
> Salesforce→Contentful, BaseHub→Vercel (links below).

## Why now: five things that changed in the last ~18 months

| # | Shift | Evidence (as-of) |
|---|---|---|
| 1 | **The category is consolidating; acquirers are paying for headless CMS** | Figma acquired **Payload** (2025-06-17, [Figma blog](https://www.figma.com/blog/payload-joins-figma)) · Vercel acquired **BaseHub** (2026-06-02, [BaseHub blog](https://basehub.com/blog/basehub-is-joining-vercel)) · Salesforce agreed to acquire **Contentful** for ~$1.5B (announced 2026-06, [Salesforce 10-Q](https://www.sec.gov/Archives/edgar/data/0001108524/000110852426000190/crm-20260731.htm), [CMSWire](https://www.cmswire.com/digital-experience/salesforce-acquires-contentful-to-power-agentforce-content/)) |
| 2 | **Both of VexCMS's named competitors now belong to platforms with other priorities** | Payload Cloud paused new deployments after the acquisition (`sources/business-model-comps.md` §3.1). BaseHub: "Vercel is not planning to enter the CMS space … nothing changes for now"; founder moved to the v0 team ([BaseHub blog](https://basehub.com/blog/basehub-is-joining-vercel)) |
| 3 | **Convex is growing quickly and has no CMS of its own** | $57M Series B, 2026-08-04; ~2M apps from ~500k developers ([PR Newswire](https://www.prnewswire.com/news-releases/convex-raises-57m-series-b-led-by-insight-partners-to-scale-the-reliable-backend-for-the-ai-era-302841686.html)) · ~10,000 paying teams ([Convex, 2026-04-02](https://news.convex.dev/enterprise-launch/)) · `convex` npm downloads 1.70M/wk vs 139k/wk a year earlier, **12.2×** ([npm API](https://api.npmjs.org/downloads/point/last-week/convex)) · Convex leaves vertical products to its Components ecosystem and wants it to become "a real marketplace" ([Convex, 2025-11-12](https://news.convex.dev/convex-raises-24m/)) |
| 4 | **TypeScript + AI agents favour typed, code-first backends** | TypeScript became the #1 language on GitHub in Aug 2025; GitHub ties this to "agent-assisted coding" ([Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/)) · Convex pitches correctness for AI-written code: "90% of AI-built apps on a traditional database silently corrupted data" vs 0% on Convex (Convex's own testing, [PR Newswire](https://www.prnewswire.com/news-releases/convex-raises-57m-series-b-led-by-insight-partners-to-scale-the-reliable-backend-for-the-ai-era-302841686.html)) · VexCMS already ships `llms.txt` for agents (`README.md:79-81`) |
| 5 | **Developers are unhappy with their CMS** | 67.5% of senior developers say their company's CMS holds them back, and 29.5% would switch for better DX (Storyblok/Sago, Jun 2025, [digit.fyi](https://www.digit.fyi/developers-are-embarrassed-over-outdated-tech-stacks/)) · 73% of businesses use headless, up from 64% in 2021 ([WP Engine, 2024-09-10](https://wpengine.com/press-releases/state-of-headless-2024/)) |

The BaseHub founder's exit note makes VexCMS's case: incumbents are "slow,
single-player, and did not have real version control," and content management "can sit
closer to the product itself" ([BaseHub blog](https://basehub.com/blog/basehub-is-joining-vercel)).
VexCMS puts the CMS inside the app's own backend, with live multi-user subscriptions and
version history designed for branching (`.agent/docs/product/backlog.md:548-627`).

## Market size: show a range

Analyst estimates for "headless CMS software" vary by more than 10×
(`sources/market-size.md` §1), so the deck should show a range with sources rather than one number.

| Layer | Figure | Source (as-of) |
|---|---|---|
| Headless CMS software, 2025 | **$1.56B–$1.8B** (mid-range estimates); outliers go from $216M to $3.95B | [Mordor, Jan 2026](https://www.mordorintelligence.com/industry-reports/headless-cms-software-market); [Grand View, 2026](https://www.grandviewresearch.com/industry-analysis/headless-content-management-system-software-market-report) |
| Headless CMS CAGR | **~17–20%** | same |
| Backend-as-a-Service, 2025 (adjacent; Convex's category) | **$4.7B–$5.2B**, ~23–25% CAGR | [FMI](https://www.futuremarketinsights.com/reports/backend-as-a-service-baas-market); [R&M](http://researchandmarkets.com/report/baas) |
| Broader CMS / WCM / DXP | $9B–$37B (CMS, 2025), tens of $B (DXP) | `sources/market-size.md` §1 table; context only, not addressable |

**Recommended slide structure: bottom-up first, top-down as context**
(Sequoia asks for market potential "built bottom-up": `sources/business-model-comps.md` §6.1)

| | Definition | Value | Basis |
|---|---|---|---|
| **TAM** | Headless CMS software spend | ~$1.6–1.8B (2025) → ~$4.4–6.2B (2031–33) | Mordor / Grand View |
| **SAM** | TS/React/Next.js-stack share of headless | ~$270–450M `[ASSUMPTION 15–25%]` | `sources/market-size.md` §6 |
| **SOM (beachhead)** | Convex paying teams that buy an enterprise add-on | ~$0.7–7.3M ARR `[ASSUMPTION: 73% in market × 5–10% conversion × $2–10k/yr]` | `04-business-model.md` §5 |

Expansion levers for the "Vision" slide: the SOM pool grows with Convex itself (12× YoY
downloads), with agencies selling VexCMS to clients, and with any future backend
adapters (the core is framework-agnostic by design; `.agent/docs/product/mission.md:9-12`).

## Developer-population context (for the bottom-up check)

| Input | Value | Source |
|---|---|---|
| Active developers worldwide | 47–48M | [SlashData 2025](https://www.slashdata.co/research/developer-population) |
| Convex developers / apps | ~500k / ~2M | Convex Series B release, 2026-08-04 |
| Supabase developers (adjacent platform) | "Reach 9 million developers" | [supabase.com/partners](https://supabase.com/partners), 2026-10-12 |
| Weekly npm installs: `next` / `convex` / `payload` / `sanity` | 67.3M / 1.70M / 0.998M / 1.04M | npm API, week of 2026-10-04 (`sources/market-size.md` §4) |

The Payload comparison matters: `convex` (1.70M/wk) now has more weekly installs than
`payload` (~1.0M/wk), and Convex has no full-featured CMS. The only CMS-like Convex component
found is a hobby "Basic Blog" component with ~539 weekly downloads (`sources/convex-ecosystem.md` §3).
Caveat: npm counts include CI and transitive installs, and `convex` is a runtime dependency of every
Convex app while `payload` is only installed by Payload users. Use the comparison as a direction,
not a ratio.
