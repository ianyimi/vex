# 05 — Platform: Convex as distribution partner and as the main risk

> Feeds slides: **Why now (platform) · Go-to-market · Risks / FAQ appendix**.
> Full citations: `sources/convex-ecosystem.md`. Expect investors to ask about this dependency
> early, so it gets its own document.

## Convex at a glance (as of 2026-10-12)

| Fact | Value | Source |
|---|---|---|
| Founded / founders | 2021; ex-Dropbox infra engineers (Jamie Turner CEO, James Cowling CTO, Sujay Jayakar) | [Forbes 2022](https://www.forbes.com/sites/kenrickcai/2022/04/27/convex-series-a-26-million-developers-dump-databases/) |
| Funding | ~$110.5M total; **$57M Series B led by Insight Partners, 2026-08-04** (a16z, Spark existing) | [PR Newswire](https://www.prnewswire.com/news-releases/convex-raises-57m-series-b-led-by-insight-partners-to-scale-the-reliable-backend-for-the-ai-era-302841686.html) |
| Scale | ~2M apps, ~500k developers; customers incl. OpenAI, Tripadvisor, Zapier | same |
| Paying teams | "nearly 10,000" | [Convex, 2026-04-02](https://news.convex.dev/enterprise-launch/) |
| Growth | `convex` npm 1.70M/wk vs 139k/wk a year earlier (12.2×) | npm API, `sources/convex-ecosystem.md` §2 |
| Pricing (end-user cost of running VexCMS) | Free tier → Pro $25/dev/mo → Business $2,500/mo min (SSO, audit logs) | [convex.dev/pricing](https://www.convex.dev/pricing) |
| Backend licence | FSL-1.1-Apache-2.0; each release becomes Apache-2.0 after 2 years; self-hosting is documented | [LICENSE.md](https://github.com/get-convex/convex-backend/blob/main/LICENSE.md), [self-hosting docs](https://docs.convex.dev/self-hosting) |

## Why the dependency helps the pitch

1. **VexCMS inherits Convex features instead of building them** (live queries, ACID, crons,
   file storage, full-text + vector search, SOC 2 Type II / HIPAA posture), per
   `apps/www/convex/seed.ts:822-849` and the Convex release ("SOC 2 Type II certified and
   HIPAA compliant"). A solo founder can ship a competitive CMS because the backend layer is
   already built.
2. **Convex customers already pay.** Every VexCMS user is a Convex account. That makes
   VexCMS a source of new Convex usage, which is the basis for a partnership.
3. **Platforms tend to acquire or partner with a CMS rather than build one.** Examples:
   Figma bought Payload; Vercel bought BaseHub while saying it is "not planning to enter the
   CMS space"; Vercel lists Sanity in its Marketplace with unified billing; Supabase lists
   Directus and Strapi as integration partners (`sources/convex-ecosystem.md` §5).

## Partnership asks (programs that exist today)

| Program | Ask |
|---|---|
| [Convex Components directory](https://www.convex.dev/components) (175 listed) | Get a featured listing, and become a launch partner when the paid marketplace arrives. The repo's own analysis found that Component *data isolation* would break VexCMS's joins with app tables (`legacy-planning/roadmap-monetization-strategy-v2.md:188`), so the ask is a **template/Stack listing**, not packaging VexCMS as a Component |
| [Convex for Startups](https://www.convex.dev/startups) + [partner channel](https://www.convex.dev/startups/partners/apply) | Offer VexCMS as the recommended CMS for startups in the program; VexCMS can also use the program for its own credits |
| [Stack](https://stack.convex.dev/) | Guest post along the lines of "Building a type-safe CMS on Convex" |
| [Convex Champions](https://www.convex.dev/champions) | Founder joins as a Champion, for a direct line to the product team |
| Convex BD (`sales@convex.dev`) | Co-marketing for Business-plan customers who need a CMS. Use the Supabase/Directus partnership as the template |

History: the founder presented at the Convex meetup on 2026-09-02 and posted in the Convex
Discord. An asks list was planned (`.agent/docs/specs/2026-08-30-launch-readiness/spec.md:1036-1042`).
**Ask the founder what Convex said.** Any acknowledgement from Convex staff is evidence worth
putting on the traction slide.

## Platform risk: likely investor objections and answers

| Risk | Answer, with evidence |
|---|---|
| Convex builds its own CMS | No public plan found. Convex's stated strategy pushes vertical products to third-party Components. A Convex-built CMS would compete with its own marketplace, and it is a ~30–43-person company focused on infrastructure (`sources/convex-ecosystem.md` §1, §6) |
| Convex raises prices or shuts down | The backend is open source and self-hostable today, and each release becomes Apache-2.0 after 2 years. The CEO has publicly addressed both fears ([Convex, 2025-11-12](https://news.convex.dev/convex-raises-24m/)). The Apr 2026 pricing update *lowered* egress prices |
| Convex gets acquired | This is also an upside scenario: VexCMS would be the CMS for the acquirer's backend (compare Payload→Figma) |
| The market is capped by Convex's size | Today, yes, and the SOM is sized that way. The core is designed to be backend-agnostic: a SpacetimeDB port was assessed and judged feasible with a core split (`.agent/docs/research/spacetimedb-vs-convex-port-feasibility.md:7-17`). Present this as an option for later, not a plan |
| Convex Components marketplace leads to many competing CMSs | Being early and complete is the defence. The only CMS-like component today is a hobby blog (~539 weekly downloads) |

## Growth trajectory (for the "ride the platform" slide)

Convex publishes **no forward customer projections**. None were found in its blog, its
fundraising releases, or its pricing posts, and no Series B valuation is disclosed. Use
historical, verifiable growth and label any forward line as your own scenario.

Monthly `convex` npm downloads ([npm range API](https://api.npmjs.org/downloads/range/2025-04-01:2026-09-30/convex), fetched 2026-10-12):

| Month | Downloads | Month | Downloads |
|---|---|---|---|
| 2025-04 | 0.11M | 2026-01 | 1.09M |
| 2025-06 | 0.20M | 2026-03 | 2.07M |
| 2025-08 | 0.35M | 2026-05 | 3.17M |
| 2025-09 | 0.48M | 2026-07 | 5.26M |
| 2025-11 | 0.70M | 2026-09 | 5.93M |

- Sep 2025 → Sep 2026: **12.4×**. Growth slowed in the last quarter: Jul→Sep 2026 was +13%,
  vs roughly +50% per quarter before that.
- Company-stated figures: "grown by more than 10x in the last nine months" (2025-11-12);
  "nearly 10,000 paying teams" (2026-04-02); ~2M apps and ~500k developers (2026-08-04).
- Caveat: npm counts include CI and are a proxy, not customers.

**[SCENARIO, not a forecast]** Paying teams 12–24 months out, from ~10k in Apr 2026:
- Flat 2×/yr → ~20k (Apr 2027), ~40k (Apr 2028).
- Recent-download pace (≈3–5×/yr) → ~30–50k by Apr 2027.

With the 04 § 5 conversion assumptions, the beachhead ceiling scales linearly:
20k teams ≈ $1.5–15M ARR, 40k ≈ $3–29M.

On the slide: show the historical chart with sources, and present the scenario table as
"VexCMS's market grows with Convex" rather than as a Convex projection.
